const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

let accessToken: string | null = null;
let accessTokenVersion = 0;
let refreshPromise: Promise<RefreshResponse | null> | null = null;

export function setAccessToken(token: string | null) {
  if (accessToken !== token) {
    accessTokenVersion += 1;
  }
  accessToken = token;
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
  setAccessToken(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toeic-auth-failed"));
  }
}

export async function refreshSession<
  ResponseData extends RefreshResponse = RefreshResponse,
>(): Promise<ResponseData | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          notifyAuthFailure();
          return null;
        }

        const data = (await response.json()) as RefreshResponse;
        setAccessToken(data.accessToken);
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to refresh token", error);
        notifyAuthFailure();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise as Promise<ResponseData | null>;
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
