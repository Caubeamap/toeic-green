"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type FieldError = string | null;

type FormStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

/* ═══════════════════════════════════════════════════════════════
   Validation helpers
   ═══════════════════════════════════════════════════════════════ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): FieldError {
  if (!value.trim()) return "Vui lòng nhập email.";
  if (!EMAIL_REGEX.test(value)) return "Email không hợp lệ.";
  return null;
}

function validatePassword(value: string): FieldError {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  return null;
}

function validateRequired(value: string, fieldName: string): FieldError {
  if (!value.trim()) return `Vui lòng nhập ${fieldName}.`;
  return null;
}

function validateSignupPassword(value: string): FieldError {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!/[A-Z]/.test(value)) return "Mật khẩu cần ít nhất 1 chữ hoa.";
  if (!/[0-9]/.test(value)) return "Mật khẩu cần ít nhất 1 chữ số.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Mật khẩu cần ít nhất 1 ký tự đặc biệt.";
  return null;
}

function validateConfirmPassword(password: string, confirm: string): FieldError {
  if (!confirm) return "Vui lòng xác nhận mật khẩu.";
  if (password !== confirm) return "Mật khẩu xác nhận không khớp.";
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Password strength evaluation
   ═══════════════════════════════════════════════════════════════ */

type PasswordCriteria = {
  length: boolean;
  upper: boolean;
  number: boolean;
  special: boolean;
};

function evaluatePassword(value: string): PasswordCriteria {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value)
  };
}

function getStrengthScore(criteria: PasswordCriteria): number {
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

/* ═══════════════════════════════════════════════════════════════
   FormAlert — error/success banner
   ═══════════════════════════════════════════════════════════════ */

function FormAlert({ status }: { status: FormStatus }) {
  if (status.type === "idle" || status.type === "submitting") return null;

  const isError = status.type === "error";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-semibold leading-relaxed",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-primary/20 bg-primary-container/20 text-on-primary-container"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{status.message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Field component (with password toggle + inline error)
   ═══════════════════════════════════════════════════════════════ */

function Field({
  action,
  autoComplete,
  error,
  icon,
  id,
  label,
  onBlur,
  onChange,
  placeholder,
  required,
  type,
  value
}: {
  action?: ReactNode;
  autoComplete?: string;
  error?: FieldError;
  icon: ReactNode;
  id: string;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type: string;
  value?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;
  const hasError = !!error;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[14px] font-bold text-on-surface-variant"
        >
          {label}
        </label>
        {action}
      </div>
      <div
        className={cn(
          "flex h-[52px] items-center gap-3 rounded-2xl border bg-white/65 px-5 transition",
          hasError
            ? "border-red-400 ring-2 ring-red-100"
            : "border-outline-variant/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        <span className={hasError ? "text-red-400" : "text-primary"}>
          {icon}
        </span>
        <input
          id={id}
          name={id}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
          placeholder={placeholder}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="shrink-0 rounded-lg p-1 text-on-surface-variant transition hover:text-primary focus:outline-none"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        ) : null}
      </div>
      {/* Inline error message */}
      {hasError ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-500"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Password Criterion row
   ═══════════════════════════════════════════════════════════════ */

function PasswordCriterion({ met, text }: { met: boolean; text: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-200",
        met ? "text-primary" : "text-on-surface-variant/50"
      )}
    >
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

/* ═══════════════════════════════════════════════════════════════
   Password Strength Indicator
   ═══════════════════════════════════════════════════════════════ */

function PasswordStrength({ password }: { password: string }) {
  const criteria = useMemo(() => evaluatePassword(password), [password]);
  const score = getStrengthScore(criteria);
  const color = getStrengthColor(score);
  const strengthLabel = getStrengthLabel(score);
  const hasInput = password.length > 0;

  return (
    <div className="space-y-3">
      {/* Strength bars */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                hasInput && score >= level
                  ? color
                  : "bg-surface-container-highest"
              )}
            />
          ))}
        </div>
        {hasInput && strengthLabel.text && (
          <span
            className={cn(
              "text-[11px] font-bold transition-colors",
              strengthLabel.className
            )}
          >
            {strengthLabel.text}
          </span>
        )}
      </div>

      {/* Criteria list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <PasswordCriterion met={criteria.length} text="Tối thiểu 8 ký tự" />
        <PasswordCriterion met={criteria.upper} text="Ít nhất 1 chữ hoa" />
        <PasswordCriterion met={criteria.number} text="Ít nhất 1 chữ số" />
        <PasswordCriterion
          met={criteria.special}
          text="Ít nhất 1 ký tự đặc biệt"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Submit Button (with loading state)
   ═══════════════════════════════════════════════════════════════ */

function SubmitButton({
  children,
  loading
}: {
  children: ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-extrabold text-white shadow-glow transition active:scale-[0.98]",
        loading
          ? "cursor-not-allowed bg-primary/60"
          : "bg-primary hover:bg-primary/90"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang xử lý...
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Login Form
   ═══════════════════════════════════════════════════════════════ */

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email: FieldError; password: FieldError }>({
    email: null,
    password: null
  });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  function validateField(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  }

  function validateAll(): boolean {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });
    return !emailErr && !passwordErr;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    setStatus({ type: "submitting" });

    // TODO: Thay bằng API call thực tế khi có backend
    // Ví dụ: const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus({
      type: "error",
      message: "Chức năng đăng nhập đang được phát triển. Hệ thống sẽ sẵn sàng khi backend được tích hợp."
    });
  }

  const isSubmitting = status.type === "submitting";

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <FormAlert status={status} />

      <Field
        id="login-email"
        label="Email"
        icon={<Mail className="h-[18px] w-[18px]" />}
        placeholder="name@example.com"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
        }}
        onBlur={() => validateField("email")}
        error={touched.email ? errors.email : null}
      />
      <Field
        id="login-password"
        action={
          <Link
            className="text-[12px] font-bold text-primary hover:underline"
            href="/login?reset=1"
          >
            Quên mật khẩu?
          </Link>
        }
        icon={<LockKeyhole className="h-[18px] w-[18px]" />}
        label="Mật khẩu"
        placeholder="••••••••"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(v) => {
          setPassword(v);
          if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
        }}
        onBlur={() => validateField("password")}
        error={touched.password ? errors.password : null}
      />

      {/* Remember me */}
      <label className="flex cursor-pointer items-center gap-3 select-none">
        <input
          type="checkbox"
          className="h-[18px] w-[18px] rounded border-outline-variant text-primary accent-primary focus:ring-primary/30"
        />
        <span className="text-[14px] font-semibold text-on-surface-variant">
          Ghi nhớ đăng nhập
        </span>
      </label>

      <SubmitButton loading={isSubmitting}>Đăng nhập</SubmitButton>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Signup Form
   ═══════════════════════════════════════════════════════════════ */

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [errors, setErrors] = useState<{
    name: FieldError;
    email: FieldError;
    password: FieldError;
    confirm: FieldError;
    terms: FieldError;
  }>({ name: null, email: null, password: null, confirm: null, terms: null });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
    terms: false
  });

  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  function validateField(field: keyof typeof errors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const updater: Record<string, () => FieldError> = {
      name: () => validateRequired(name, "họ và tên"),
      email: () => validateEmail(email),
      password: () => validateSignupPassword(password),
      confirm: () => validateConfirmPassword(password, confirm),
      terms: () => (!agreed ? "Bạn cần đồng ý với điều khoản." : null)
    };
    setErrors((prev) => ({ ...prev, [field]: updater[field]() }));
  }

  function validateAll(): boolean {
    const result = {
      name: validateRequired(name, "họ và tên"),
      email: validateEmail(email),
      password: validateSignupPassword(password),
      confirm: validateConfirmPassword(password, confirm),
      terms: !agreed ? "Bạn cần đồng ý với điều khoản." : null
    };
    setErrors(result);
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    return !Object.values(result).some(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    setStatus({ type: "submitting" });

    // TODO: Thay bằng API call thực tế khi có backend
    // Ví dụ: const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus({
      type: "error",
      message: "Chức năng đăng ký đang được phát triển. Hệ thống sẽ sẵn sàng khi backend được tích hợp."
    });
  }

  const isSubmitting = status.type === "submitting";

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <FormAlert status={status} />

      <Field
        id="signup-name"
        label="Họ và tên"
        icon={<UserRound className="h-[18px] w-[18px]" />}
        placeholder="Nguyễn Minh Anh"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(v) => {
          setName(v);
          if (touched.name) setErrors((prev) => ({ ...prev, name: validateRequired(v, "họ và tên") }));
        }}
        onBlur={() => validateField("name")}
        error={touched.name ? errors.name : null}
      />
      <Field
        id="signup-email"
        label="Email"
        icon={<Mail className="h-[18px] w-[18px]" />}
        placeholder="name@example.com"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
        }}
        onBlur={() => validateField("email")}
        error={touched.email ? errors.email : null}
      />
      <Field
        id="signup-password"
        label="Mật khẩu"
        icon={<LockKeyhole className="h-[18px] w-[18px]" />}
        placeholder="Tối thiểu 8 ký tự"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(v) => {
          setPassword(v);
          if (touched.password) setErrors((prev) => ({ ...prev, password: validateSignupPassword(v) }));
          if (touched.confirm && confirm) setErrors((prev) => ({ ...prev, confirm: validateConfirmPassword(v, confirm) }));
        }}
        onBlur={() => validateField("password")}
        error={touched.password ? errors.password : null}
      />
      <Field
        id="signup-confirm"
        label="Xác nhận mật khẩu"
        icon={<LockKeyhole className="h-[18px] w-[18px]" />}
        placeholder="Nhập lại mật khẩu"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          if (touched.confirm) setErrors((prev) => ({ ...prev, confirm: validateConfirmPassword(password, v) }));
        }}
        onBlur={() => validateField("confirm")}
        error={touched.confirm ? errors.confirm : null}
      />

      {/* Password strength indicator */}
      <PasswordStrength password={password} />

      {/* Terms agreement */}
      <div>
        <label className="flex cursor-pointer items-start gap-3 select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (touched.terms) {
                setErrors((prev) => ({
                  ...prev,
                  terms: !e.target.checked ? "Bạn cần đồng ý với điều khoản." : null
                }));
              }
            }}
            className="mt-0.5 h-[18px] w-[18px] rounded border-outline-variant text-primary accent-primary focus:ring-primary/30"
          />
          <span className="text-[13px] leading-relaxed text-on-surface-variant">
            Tôi đồng ý với{" "}
            <Link href="#" className="font-bold text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="#" className="font-bold text-primary hover:underline">
              Chính sách bảo mật
            </Link>{" "}
            của TOEIC Green.
          </span>
        </label>
        {touched.terms && errors.terms ? (
          <p
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-500"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.terms}
          </p>
        ) : null}
      </div>

      <SubmitButton loading={isSubmitting}>Tạo tài khoản</SubmitButton>
    </form>
  );
}
