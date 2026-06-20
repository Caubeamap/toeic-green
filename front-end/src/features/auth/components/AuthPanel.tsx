"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm, SignupForm } from "./CredentialForms";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuth } from "../hooks/auth";
import { cn } from "@/lib/utils";

/* ─────────────────────────── Types ─────────────────────────── */

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  initialMode: AuthMode;
  redirectTo?: string;
};

/* ─────────────────────── Animation config ─────────────────────── */

/* ─────────────────────── Heading data ─────────────────────── */

const headings: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Chào mừng trở lại!",
    subtitle: "Đăng nhập để tiếp tục luyện tập và xem lại kết quả của bạn."
  },
  signup: {
    title: "Tạo tài khoản mới",
    subtitle:
      "Đăng ký miễn phí để bắt đầu luyện thi TOEIC và lưu kết quả làm bài."
  }
};

/* ═══════════════════════════════════════════════════════════════
   AuthPanel — Client Component with animated form switching
   ═══════════════════════════════════════════════════════════════ */

export function AuthPanel({ initialMode, redirectTo }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const destination = redirectTo ?? "/";

  /* Redirect immediately if already authenticated */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(destination);
    }
  }, [isAuthenticated, router, destination]);

  /* Listen for login attempt from LoginForm */
  useEffect(() => {
    async function handleLoginAttempt(e: Event) {
      const { email, password, rememberMe } = (e as CustomEvent).detail;
      const result = await login(email, password, rememberMe === true);

      if (!result.ok) {
        /* Re-dispatch error back so LoginForm can display it */
        window.dispatchEvent(
          new CustomEvent("toeic-login-error", {
            detail: { error: result.error }
          })
        );
      }
    }

    window.addEventListener("toeic-login-attempt", handleLoginAttempt);
    return () =>
      window.removeEventListener("toeic-login-attempt", handleLoginAttempt);
  }, [login]);

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return;
    setMode(newMode);

    // Sync URL without full navigation (giữ lại next nếu có)
    const params = new URLSearchParams();
    params.set("mode", newMode);
    if (redirectTo) {
      params.set("next", redirectTo);
    }
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }

  const heading = headings[mode];

  return (
    <div className="w-full max-w-[520px] rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-soft sm:p-10">
      <div className="mb-8">
        <h2 className="text-[26px] font-extrabold leading-tight text-on-surface">
          {heading.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-on-surface-variant">
          {heading.subtitle}
        </p>
      </div>

      {/* Đăng nhập / đăng ký bằng Google (ẩn nếu chưa cấu hình client id) */}
      <GoogleSignInButton />

      {/* Tab Toggle */}
      <div className="relative mb-8 grid grid-cols-2 rounded-full bg-surface-container-low p-1.5">
        <div
          className={cn(
            "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-sm transition-transform duration-150 ease-out",
            mode === "login" ? "translate-x-1.5" : "translate-x-[calc(100%+6px)]"
          )}
        />
        <TabButton
          active={mode === "login"}
          onClick={() => switchMode("login")}
        >
          Đăng nhập
        </TabButton>
        <TabButton
          active={mode === "signup"}
          onClick={() => switchMode("signup")}
        >
          Đăng ký
        </TabButton>
      </div>

      <div className="relative overflow-hidden">
        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>

      {/* Mode switch footer link */}
      <p className="mt-8 text-center text-[14px] text-on-surface-variant">
        {mode === "login" ? (
          <>
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-bold text-primary hover:underline"
            >
              Đăng ký ngay
            </button>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-bold text-primary hover:underline"
            >
              Đăng nhập
            </button>
          </>
        )}
      </p>
    </div>
  );
}

/* ─────────────────────── Tab Button ─────────────────────── */

function TabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative z-10 rounded-full px-5 py-3.5 text-center text-[15px] font-extrabold transition-colors duration-200",
        active
          ? "text-primary"
          : "text-on-surface-variant hover:text-on-surface"
      )}
    >
      {children}
    </button>
  );
}
