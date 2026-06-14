const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

type RequestOptions = RequestInit & {
  body?: any;
};

async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Gửi nhận cookie refresh_token
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
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
        const data = await refreshResponse.json();
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
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Bỏ qua lỗi parse
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: "GET" }),
  post: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: "POST", body }),
  put: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: "PUT", body }),
  patch: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: "PATCH", body }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: "DELETE" }),
};
