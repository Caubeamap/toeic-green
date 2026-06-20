"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/auth";

/* ─────────────────────── Google Identity Services types ───────────────────────
   Khai báo tối thiểu phần GIS mà component dùng (tránh `any`). */
interface GoogleCredentialResponse {
  credential?: string;
}
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: Record<string, unknown>,
  ) => void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Tải script GIS đúng một lần cho cả ứng dụng. */
function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.google?.accounts?.id) resolve();
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
}

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Không nhận được thông tin từ Google. Vui lòng thử lại.");
        return;
      }
      setError(null);
      const result = await loginWithGoogle(response.credential);
      if (!result.ok) {
        setError(result.error ?? "Đăng nhập bằng Google thất bại.");
      }
      // Thành công: AuthPanel tự điều hướng khi isAuthenticated chuyển true.
    },
    [loginWithGoogle],
  );

  // Giữ callback mới nhất trong ref để effect khởi tạo GIS chỉ chạy một lần,
  // không bị chạy lại (và gọi initialize() nhiều lần) khi handleCredential đổi identity.
  const handleCredentialRef = useRef(handleCredential);
  useEffect(() => {
    handleCredentialRef.current = handleCredential;
  }, [handleCredential]);

  useEffect(() => {
    if (!CLIENT_ID || renderedRef.current) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || renderedRef.current) return;
        const id = window.google?.accounts?.id;
        const container = containerRef.current;
        if (!id || !container) return;

        id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            void handleCredentialRef.current(response);
          },
        });
        container.innerHTML = "";
        id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          locale: "vi",
          width: 320,
        });
        renderedRef.current = true;
      })
      .catch(() => {
        if (!cancelled) {
          setError("Không tải được đăng nhập Google. Kiểm tra kết nối mạng.");
        }
      });

    return () => {
      cancelled = true;
    };
    // Khởi tạo GIS một lần duy nhất; callback được đọc qua ref nên không cần deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tính năng tắt khi chưa cấu hình client id → không render gì.
  if (!CLIENT_ID) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-center">
        <div ref={containerRef} className="min-h-[40px]" />
      </div>
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
