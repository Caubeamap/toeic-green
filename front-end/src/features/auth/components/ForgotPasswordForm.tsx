"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertCircle, Check, Loader2, Mail, ArrowLeft, LockKeyhole, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";

type FormStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function evaluatePassword(value: string) {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value)
  };
}

function getStrengthScore(criteria: ReturnType<typeof evaluatePassword>): number {
  return [criteria.length, criteria.upper, criteria.number, criteria.special].filter(Boolean).length;
}

function getStrengthColor(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-orange-400";
  if (score === 3) return "bg-yellow-400";
  return "bg-primary";
}

function getStrengthLabel(score: number): { text: string; className: string } {
  if (score === 0) return { text: "", className: "" };
  if (score <= 1) return { text: "Yếu", className: "text-red-500" };
  if (score === 2) return { text: "Trung bình", className: "text-orange-500" };
  if (score === 3) return { text: "Khá", className: "text-yellow-600" };
  return { text: "Mạnh", className: "text-primary" };
}

function PasswordCriterion({ met, text }: { met: boolean; text: string }) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-200",
      met ? "text-primary" : "text-on-surface-variant/50"
    )}>
      {met ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <span className="flex h-3.5 w-3.5 items-center justify-center">
          <span className="h-1 w-1 rounded-full bg-current" />
        </span>
      )}
      {text}
    </span>
  );
}

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "otp" | "new-password" | "success">("email");
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password: string | null; confirm: string | null }>({
    password: null,
    confirm: null
  });

  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedFields, setTouchedFields] = useState({ password: false, confirm: false });
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verifyOtpCode = useCallback(async (code: string) => {
    setStatus({ type: "submitting" });
    try {
      await api.post("/auth/verify-reset-otp", {
        email: email.trim(),
        otp: code.trim(),
      });
      setStatus({ type: "success", message: "Mã xác nhận hợp lệ. Bạn có thể đặt mật khẩu mới." });
      setTimeout(() => {
        setStep("new-password");
        setStatus({ type: "idle" });
      }, 300);
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: getErrorMessage(err, "Mã xác nhận không đúng hoặc đã hết hạn.")
      });
      // Reset lại OTP để người dùng nhập lại
      setOtpValues(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [email]);

  // Tự động kiểm tra OTP khi nhập đủ 6 ô
  useEffect(() => {
    const otpString = otpValues.join("");
    if (otpString.length === 6 && step === "otp") {
      const timer = setTimeout(() => {
        verifyOtpCode(otpString);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [otpValues, step, verifyOtpCode]);

  // Tự động focus ô đầu tiên khi chuyển sang bước OTP
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  function validateEmail(val: string) {
    if (!val.trim()) return "Vui lòng nhập email.";
    if (!EMAIL_REGEX.test(val)) return "Email không hợp lệ.";
    return null;
  }

  function validatePassword(val: string) {
    if (!val) return "Vui lòng nhập mật khẩu mới.";
    if (val.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (!/[A-Z]/.test(val)) return "Mật khẩu cần ít nhất 1 chữ hoa.";
    if (!/[0-9]/.test(val)) return "Mật khẩu cần ít nhất 1 chữ số.";
    if (!/[^A-Za-z0-9]/.test(val)) return "Mật khẩu cần ít nhất 1 ký tự đặc biệt.";
    return null;
  }

  function validateConfirm(val: string) {
    if (!val) return "Vui lòng xác nhận mật khẩu.";
    if (password !== val) return "Mật khẩu xác nhận không khớp.";
    return null;
  }

  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const score = getStrengthScore(criteria);
  const color = getStrengthColor(score);
  const strengthLabel = getStrengthLabel(score);
  const hasInput = password.length > 0;

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = "";
      setOtpValues(newOtpValues);
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanValue.substring(cleanValue.length - 1);
    setOtpValues(newOtpValues);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").substring(0, 6);
    if (pastedData.length === 6) {
      setOtpValues(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setTouchedEmail(true);
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setStatus({ type: "submitting" });
    try {
      const res = await api.post<{ message: string }>("/auth/forgot-password", {
        email: email.trim()
      });
      setStatus({ type: "success", message: res.message });
      setTimeout(() => {
        setStep("otp");
        setStatus({ type: "idle" });
      }, 300);
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: getErrorMessage(err, "Gửi mã xác nhận thất bại. Vui lòng thử lại.")
      });
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setTouchedFields({ password: true, confirm: true });

    const passErr = validatePassword(password);
    const confErr = validateConfirm(confirmPassword);

    if (passErr || confErr) {
      setErrors({ password: passErr, confirm: confErr });
      return;
    }

    const otpString = otpValues.join("");
    setStatus({ type: "submitting" });
    try {
      const res = await api.post<{ message: string }>("/auth/reset-password", {
        email: email.trim(),
        otp: otpString,
        password
      });
      setStatus({ type: "success", message: res.message });
      setStep("success");
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: getErrorMessage(err, "Đặt lại mật khẩu thất bại. Vui lòng thử lại.")
      });
    }
  }

  async function handleResendOtp() {
    setStatus({ type: "submitting" });
    try {
      await api.post<{ message: string }>("/auth/forgot-password", {
        email: email.trim()
      });
      setStatus({ type: "success", message: "Đã gửi lại mã xác nhận mới vào email." });
      setOtpValues(Array(6).fill(""));
      setTimeout(() => {
        setStatus({ type: "idle" });
        inputRefs.current[0]?.focus();
      }, 500);
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: getErrorMessage(err, "Không thể gửi lại mã xác nhận.")
      });
    }
  }

  const isSubmitting = status.type === "submitting";

  if (step === "success") {
    return (
      <div className="w-full max-w-[480px] rounded-[28px] border border-white/70 bg-white/90 p-7 text-center shadow-glass backdrop-blur-md sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-[26px] font-extrabold text-on-surface">Mật khẩu đã được cập nhật</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-on-surface-variant">
          Mật khẩu của bạn đã được cập nhật thành công. Tất cả các phiên đăng nhập khác đã được đăng xuất để bảo mật. Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary/90"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] rounded-[28px] border border-white/70 bg-white/88 p-7 shadow-glass backdrop-blur-md sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-extrabold text-on-surface">Quên mật khẩu</h1>
        <p className="mt-3 text-body-md text-on-surface-variant leading-relaxed">
          {step === "email" && "Nhập địa chỉ email đăng ký tài khoản để nhận mã xác nhận."}
          {step === "otp" && `Nhập mã xác nhận 6 số đã được gửi đến email:`}
          {step === "otp" && <span className="block font-bold text-on-surface mt-1">{email}</span>}
          {step === "new-password" && "Đặt mật khẩu mới cho tài khoản của bạn."}
        </p>
      </div>

      {status.type === "error" && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold leading-relaxed text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      {status.type === "success" && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-container/20 px-4 py-3 text-[13px] font-semibold leading-relaxed text-on-primary-container">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{status.message}</span>
        </div>
      )}

      {step === "email" && (
        <form noValidate onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2.5 block text-[14px] font-bold text-on-surface-variant">
              Địa chỉ Email
            </label>
            <div className={cn(
              "flex h-[52px] items-center gap-3 rounded-2xl border bg-white/65 px-5 transition",
              touchedEmail && emailError
                ? "border-red-400 ring-2 ring-red-100"
                : "border-outline-variant/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            )}>
              <span className={touchedEmail && emailError ? "text-red-400" : "text-primary"}>
                <Mail className="h-[18px] w-[18px]" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touchedEmail) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={() => {
                  setTouchedEmail(true);
                  setEmailError(validateEmail(email));
                }}
              />
            </div>
            {touchedEmail && emailError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-extrabold text-white shadow-glow transition-colors",
              isSubmitting ? "cursor-not-allowed bg-primary/60" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang gửi mã xác nhận...
              </>
            ) : (
              "Gửi mã xác nhận"
            )}
          </button>

          <div className="pt-2 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-6">
          <div>
            <label className="mb-4 block text-center text-[14px] font-bold text-on-surface-variant">
              Mã xác nhận (OTP)
            </label>
            <div className="flex justify-center gap-3 py-2">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className={cn(
                    "h-12 w-12 rounded-xl border text-center text-[20px] font-extrabold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/65",
                    status.type === "error"
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-outline-variant/70 focus:border-primary"
                  )}
                  disabled={isSubmitting}
                />
              ))}
            </div>
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[13px] font-semibold text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xác nhận mã...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setStatus({ type: "idle" });
              }}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-on-surface-variant hover:text-primary transition"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Nhập lại email
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isSubmitting}
              className="text-[13px] font-bold text-primary hover:underline disabled:opacity-50"
            >
              Gửi lại mã xác nhận
            </button>
          </div>
        </div>
      )}

      {step === "new-password" && (
        <form noValidate onSubmit={handleResetPassword} className="space-y-5">
          {/* Password field */}
          <div>
            <label htmlFor="password" className="mb-2.5 block text-[14px] font-bold text-on-surface-variant">
              Mật khẩu mới
            </label>
            <div className={cn(
              "flex h-[52px] items-center gap-3 rounded-2xl border bg-white/65 px-5 transition",
              touchedFields.password && errors.password
                ? "border-red-400 ring-2 ring-red-100"
                : "border-outline-variant/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            )}>
              <span className={touchedFields.password && errors.password ? "text-red-400" : "text-primary"}>
                <LockKeyhole className="h-[18px] w-[18px]" />
              </span>
              <input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touchedFields.password) {
                    setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                  }
                  if (touchedFields.confirm) {
                    setErrors(prev => ({ ...prev, confirm: e.target.value !== confirmPassword ? "Mật khẩu xác nhận không khớp." : null }));
                  }
                }}
                onBlur={() => {
                  setTouchedFields(prev => ({ ...prev, password: true }));
                  setErrors(prev => ({ ...prev, password: validatePassword(password) }));
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="text-on-surface-variant/50 hover:text-on-surface-variant transition"
                onClick={() => setVisible(p => !p)}
              >
                {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {touchedFields.password && errors.password && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Password Strength Meter */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-variant/10 p-4">
            <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-on-surface-variant">
              <span>Độ mạnh mật khẩu</span>
              <span className={strengthLabel.className}>{strengthLabel.text}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/20">
              <div
                className={cn("h-full transition-all duration-300", color)}
                style={{ width: hasInput ? `${(score / 4) * 100}%` : "0%" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <PasswordCriterion met={criteria.length} text="Tối thiểu 8 ký tự" />
              <PasswordCriterion met={criteria.upper} text="Có chữ in hoa (A-Z)" />
              <PasswordCriterion met={criteria.number} text="Có chữ số (0-9)" />
              <PasswordCriterion met={criteria.special} text="Có ký tự đặc biệt" />
            </div>
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="mb-2.5 block text-[14px] font-bold text-on-surface-variant">
              Xác nhận mật khẩu mới
            </label>
            <div className={cn(
              "flex h-[52px] items-center gap-3 rounded-2xl border bg-white/65 px-5 transition",
              touchedFields.confirm && errors.confirm
                ? "border-red-400 ring-2 ring-red-100"
                : "border-outline-variant/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            )}>
              <span className={touchedFields.confirm && errors.confirm ? "text-red-400" : "text-primary"}>
                <LockKeyhole className="h-[18px] w-[18px]" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={confirmVisible ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touchedFields.confirm) {
                    setErrors(prev => ({ ...prev, confirm: validateConfirm(e.target.value) }));
                  }
                }}
                onBlur={() => {
                  setTouchedFields(prev => ({ ...prev, confirm: true }));
                  setErrors(prev => ({ ...prev, confirm: validateConfirm(confirmPassword) }));
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={confirmVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="text-on-surface-variant/50 hover:text-on-surface-variant transition"
                onClick={() => setConfirmVisible(p => !p)}
              >
                {confirmVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {touchedFields.confirm && errors.confirm && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-extrabold text-white shadow-glow transition-colors",
              isSubmitting ? "cursor-not-allowed bg-primary/60" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xác nhận...
              </>
            ) : (
              "Xác nhận đặt lại mật khẩu"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
