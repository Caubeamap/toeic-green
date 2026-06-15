"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, MailCheck, RefreshCw } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

type VerificationState =
  | { type: "waiting" }
  | { type: "verifying" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function VerifyEmailPanel({
  initialEmail,
  token
}: {
  initialEmail: string;
  token: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<VerificationState>(
    token ? { type: "verifying" } : { type: "waiting" }
  );
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        const result = await api.post<{ message: string }>("/auth/verify-email", {
          token
        });
        if (!cancelled) {
          setState({ type: "success", message: result.message });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setState({
            type: "error",
            message: getErrorMessage(error, "Không thể xác minh email.")
          });
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function resend() {
    if (!email.trim()) return;

    setIsResending(true);
    setResendMessage("");
    try {
      const result = await api.post<{ message: string }>(
        "/auth/resend-verification",
        { email }
      );
      setResendMessage(result.message);
    } catch (error: unknown) {
      setResendMessage(getErrorMessage(error, "Không thể gửi lại email xác minh."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="w-full max-w-[560px] rounded-[28px] border border-white/70 bg-white/90 p-7 text-center shadow-soft sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {state.type === "verifying" ? (
          <LoaderCircle className="h-8 w-8 animate-spin" />
        ) : state.type === "success" ? (
          <CheckCircle2 className="h-8 w-8" />
        ) : (
          <MailCheck className="h-8 w-8" />
        )}
      </div>

      <h1 className="mt-6 text-[28px] font-extrabold text-on-surface">
        {state.type === "success" ? "Email đã được xác minh" : "Xác minh email"}
      </h1>

      <p className="mt-3 text-[15px] leading-relaxed text-on-surface-variant">
        {state.type === "verifying" &&
          "TOEIC Green đang kiểm tra liên kết xác minh của bạn."}
        {state.type === "success" &&
          "Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập để tiếp tục học."}
        {state.type === "error" && state.message}
        {state.type === "waiting" &&
          "Chúng tôi đã gửi liên kết xác minh. Hãy kiểm tra hộp thư trước khi đăng nhập."}
      </p>

      {state.type === "success" ? (
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary/90"
        >
          Đăng nhập
        </Link>
      ) : (
        <div className="mt-7 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary"
          />
          <button
            type="button"
            disabled={isResending || !email.trim()}
            onClick={() => void resend()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            Gửi lại email xác minh
          </button>
          {resendMessage && (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {resendMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
