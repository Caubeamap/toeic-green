"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LoginForm, SignupForm } from "@/components/AuthForms";
import { cn } from "@/lib/utils";

/* ─────────────────────────── Types ─────────────────────────── */

type AuthMode = "login" | "signup";

type AuthCardProps = {
  initialMode: AuthMode;
  redirectTo: string;
};

/* ─────────────────────── Animation config ─────────────────────── */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(4px)"
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)"
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    filter: "blur(4px)"
  })
};

const transition = {
  x: { type: "spring" as const, stiffness: 350, damping: 32 },
  opacity: { duration: 0.25 },
  filter: { duration: 0.2 }
};

/* ─────────────────────── Heading data ─────────────────────── */

const headings: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Chào mừng trở lại!",
    subtitle: "Đăng nhập để tiếp tục luyện tập và xem lại kết quả của bạn."
  },
  signup: {
    title: "Tạo tài khoản mới",
    subtitle:
      "Đăng ký miễn phí để bắt đầu luyện thi TOEIC cùng lộ trình thông minh."
  }
};

/* ═══════════════════════════════════════════════════════════════
   AuthCard — Client Component with animated form switching
   ═══════════════════════════════════════════════════════════════ */

export function AuthCard({ initialMode, redirectTo }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [direction, setDirection] = useState(0);
  const router = useRouter();

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return;
    setDirection(newMode === "signup" ? 1 : -1);
    setMode(newMode);

    // Sync URL without full navigation
    const params = new URLSearchParams();
    params.set("mode", newMode);
    params.set("next", redirectTo);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }

  const heading = headings[mode];

  return (
    <div className="w-full max-w-[520px] rounded-[28px] border border-white/70 bg-white/72 p-6 shadow-glass backdrop-blur-xl sm:p-10">
      {/* Animated heading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`heading-${mode}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-[26px] font-extrabold leading-tight text-on-surface">
            {heading.title}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-on-surface-variant">
            {heading.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tab Toggle */}
      <div className="relative mb-8 grid grid-cols-2 rounded-full bg-surface-container-low p-1.5">
        {/* Animated pill indicator */}
        <motion.div
          className="absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-sm"
          animate={{ x: mode === "login" ? 6 : "calc(100% + 6px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
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

      {/* Animated form transition */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {mode === "login" ? <LoginForm /> : <SignupForm />}
          </motion.div>
        </AnimatePresence>
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
