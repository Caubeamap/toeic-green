"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/auth";

/* ─────────────────── Google Identity Services (OAuth2 code flow) ───────────────────
   Dùng authorization-code flow (popup) với nút TỰ VẼ để hiển thị nút "Đăng nhập bằng
   Google" generic, KHÔNG cá nhân hoá theo tài khoản đang đăng nhập (renderButton mặc
   định của Google luôn hiện "Tiếp tục bằng tên X" và không tắt được). */
interface GoogleCodeResponse {
  code?: string;
  error?: string;
}
interface GoogleCodeClient {
  requestCode: () => void;
}
interface GoogleOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleCodeClient;
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
let googleScriptPromise: Promise<void> | null = null;

/** Tải script GIS đúng một lần cho cả ứng dụng. */
function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

/** Logo Google "G" 4 màu chính thức. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const codeClientRef = useRef<GoogleCodeClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCode = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);
      const result = await loginWithGoogle(code);
      setLoading(false);
      if (!result.ok) {
        setError(result.error ?? "Đăng nhập bằng Google thất bại.");
      }
      // Thành công: AuthPanel tự điều hướng khi isAuthenticated chuyển true.
    },
    [loginWithGoogle],
  );

  // Giữ callback mới nhất trong ref để effect khởi tạo chỉ chạy một lần.
  const handleCodeRef = useRef(handleCode);
  useEffect(() => {
    handleCodeRef.current = handleCode;
  }, [handleCode]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) return;
        codeClientRef.current = oauth2.initCodeClient({
          client_id: CLIENT_ID,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response) => {
            if (response.code) {
              void handleCodeRef.current(response.code);
            } else {
              setLoading(false);
              setError("Đăng nhập Google bị huỷ hoặc thất bại.");
            }
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("Không tải được đăng nhập Google. Kiểm tra kết nối mạng.");
        }
      });

    return () => {
      cancelled = true;
    };
    // Khởi tạo một lần; callback đọc qua ref nên không cần deps.
  }, []);

  // Tính năng tắt khi chưa cấu hình client id → không render gì.
  if (!CLIENT_ID) return null;

  const handleClick = () => {
    if (loading) return;
    setError(null);
    const client = codeClientRef.current;
    if (!client) {
      setError("Đăng nhập Google chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }
    client.requestCode();
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-outline-variant bg-surface text-[15px] font-medium text-on-surface transition hover:bg-surface-variant/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        <span>{loading ? "Đang đăng nhập…" : "Đăng nhập bằng Google"}</span>
      </button>
      {error ? (
        <p className="mt-3 text-center text-[13px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant" />
        <span className="text-[13px] font-medium text-on-surface-variant">
          hoặc
        </span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>
    </div>
  );
}
