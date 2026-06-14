const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
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

async function request<ResponseData = void>(
  path: string,
  options: RequestOptions = {}
): Promise<ResponseData> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const { body, ...requestInit } = options;

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
    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as RefreshResponse;
        accessToken = data.accessToken;

        // Gọi lại request ban đầu với token mới
        headers.set("Authorization", `Bearer ${accessToken}`);
        fetchOptions.headers = headers;
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh token đã hết hạn hoặc không hợp lệ -> Đăng xuất
        accessToken = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("toeic-auth-failed"));
        }
      }
    } catch (error) {
      console.error("Failed to refresh token", error);
      accessToken = null;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("toeic-auth-failed"));
      }
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
    options?: RequestOptions
  ) => request<ResponseData>(path, { ...options, method: "POST", body }),
  put: <ResponseData = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => request<ResponseData>(path, { ...options, method: "PUT", body }),
  patch: <ResponseData = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => request<ResponseData>(path, { ...options, method: "PATCH", body }),
  delete: <ResponseData = void>(path: string, options?: RequestOptions) =>
    request<ResponseData>(path, { ...options, method: "DELETE" }),
};
