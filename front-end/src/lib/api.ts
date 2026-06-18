import { postAuthMessage, subscribeAuthMessages } from "./auth-channel";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";
const REFRESH_LOCK = "toeic-green-auth-refresh";
// Cửa sổ coi token vừa nhận (từ tab khác hoặc lần refresh trước) là còn tươi để
// bỏ qua một lần gọi /auth/refresh thừa khi đang giữ lock.
const FRESH_TOKEN_WINDOW_MS = 5_000;

let accessToken: string | null = null;
let accessTokenVersion = 0;
let lastTokenAt = 0;
let refreshPromise: Promise<RefreshResponse | null> | null = null;

export function setAccessToken(
  token: string | null,
  options: { broadcast?: boolean; markFresh?: boolean } = {}
) {
  const { broadcast = false, markFresh = true } = options;
  if (accessToken !== token) {
    accessTokenVersion += 1;
  }
  accessToken = token;
  // `lastTokenAt` đánh dấu token "vừa được refresh" để bỏ qua refresh thừa trong
  // FRESH_TOKEN_WINDOW. Token KHÔI PHỤC từ storage (markFresh=false) KHÔNG phải vừa
  // refresh — tuổi của nó không rõ — nên không được đánh dấu tươi, nếu không lần
  // hydrate đầu sẽ short-circuit và trả về token thiếu user/profile → logout nhầm khi F5.
  if (token && markFresh) {
    lastTokenAt = Date.now();
  }

  // Phát thay đổi sang các tab khác (chỉ khi do tab này khởi xướng, không phát
  // lại khi đang xử lý message nhận được → tránh vòng lặp).
  if (broadcast) {
    postAuthMessage(
      token ? { type: "token", token, at: lastTokenAt } : { type: "logout" }
    );
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type RefreshResponse = {
  accessToken: string;
};

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function notifyAuthFailure() {
  // Refresh token là cookie dùng chung → phiên chết với mọi tab; phát logout sang
  // các tab khác để chúng cũng thoát.
  setAccessToken(null, { broadcast: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toeic-auth-failed"));
  }
}

async function fetchRefresh(): Promise<RefreshResponse | null> {
  // Nếu một tab khác (hoặc lần chạy trước trong tab này) vừa cấp token mới trong
  // FRESH_TOKEN_WINDOW_MS thì dùng luôn, khỏi gọi /auth/refresh thừa (giảm đua
  // rotation). Web Locks ở refreshSession đã đảm bảo các lần refresh tuần tự.
  if (accessToken && Date.now() - lastTokenAt < FRESH_TOKEN_WINDOW_MS) {
    return { accessToken };
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      notifyAuthFailure();
      return null;
    }

    const data = (await response.json()) as RefreshResponse;
    setAccessToken(data.accessToken, { broadcast: true });
    return data;
  } catch {
    notifyAuthFailure();
    return null;
  }
}

export async function refreshSession<
  ResponseData extends RefreshResponse = RefreshResponse,
>(): Promise<ResponseData | null> {
  if (!refreshPromise) {
    // Single-flight TRONG tab (refreshPromise) + GIỮA các tab (Web Locks nếu có).
    // Web Locks tuần tự hoá nên hai tab không cùng gửi refresh token cũ một lúc
    // (nguyên nhân gây replay → logout nhầm). Trình duyệt cũ không có Web Locks
    // thì lui về single-flight trong tab + cửa sổ token tươi (giảm thiểu đua).
    const run =
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request(REFRESH_LOCK, () => fetchRefresh())
        : fetchRefresh();

    refreshPromise = Promise.resolve(run).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise as Promise<ResponseData | null>;
}

// Lắng nghe đồng bộ từ các tab khác (chỉ ở trình duyệt, đăng ký một lần/tab).
if (typeof window !== "undefined") {
  subscribeAuthMessages((message) => {
    if (message.type === "token") {
      if (message.token !== accessToken) {
        // Nhận token từ tab khác → áp dụng, KHÔNG phát lại (tránh vòng lặp).
        setAccessToken(message.token);
      }
    } else {
      // Tab khác đã logout/hết phiên → tab này cũng thoát (không phát lại).
      if (accessToken !== null) {
        setAccessToken(null);
      }
      window.dispatchEvent(new CustomEvent("toeic-auth-failed"));
    }
  });
}

async function refreshAccessToken(): Promise<boolean> {
  return (await refreshSession()) !== null;
}

async function request<ResponseData = void>(
  path: string,
  options: RequestOptions = {},
): Promise<ResponseData> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const { body, ...requestInit } = options;
  const requestAccessTokenVersion = accessTokenVersion;

  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...requestInit,
    headers,
    credentials: "include", // Gửi nhận cookie refresh_token
  };

  if (body instanceof FormData) {
    fetchOptions.body = body;
  } else if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response = await fetch(url, fetchOptions);

  // Đánh chặn lỗi 401 để tự động refresh token
  if (
    response.status === 401 &&
    !path.startsWith("/auth/refresh") &&
    !path.startsWith("/auth/login")
  ) {
    const refreshed =
      accessToken !== null && accessTokenVersion !== requestAccessTokenVersion
        ? true
        : await refreshAccessToken();
    if (refreshed && accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
      fetchOptions.headers = headers;
      response = await fetch(url, fetchOptions);
    }
  }

  if (!response.ok) {
    let errorMessage = "Đã xảy ra lỗi hệ thống.";
    try {
      const errorData: unknown = await response.json();
      if (hasMessage(errorData)) {
        errorMessage = errorData.message;
      }
    } catch {
      // Bỏ qua lỗi parse
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<ResponseData>;
  }

  return undefined as ResponseData;
}

export const api = {
  get: <ResponseData = void>(path: string, options?: RequestOptions) =>
    request<ResponseData>(path, { ...options, method: "GET" }),
  post: <ResponseData = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<ResponseData>(path, { ...options, method: "POST", body }),
  put: <ResponseData = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<ResponseData>(path, { ...options, method: "PUT", body }),
  patch: <ResponseData = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<ResponseData>(path, { ...options, method: "PATCH", body }),
  delete: <ResponseData = void>(path: string, options?: RequestOptions) =>
    request<ResponseData>(path, { ...options, method: "DELETE" }),
};
