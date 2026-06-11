import type { Metadata } from "next";
import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/* ─────────────────────────── Types ─────────────────────────── */

type AuthMode = "login" | "signup";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    next?: string;
  }>;
};

/* ─────────────────────────── SEO ─────────────────────────── */

export const metadata: Metadata = {
  title: "Đăng nhập & Đăng ký | TOEIC Green",
  description: "Đăng nhập TOEIC Green để luyện đề, lưu kết quả và ghi chú từ vựng."
};

/* ─────────────────────── Benefit chips ─────────────────────── */

const benefits = [
  { icon: BookOpen, text: "Truy cập bộ đề luyện thi" },
  { icon: CheckCircle2, text: "Lưu kết quả & lịch sử" },
  { icon: ShieldCheck, text: "Lộ trình học gợi ý" }
];

/* ─────────────────────── Page Component ─────────────────────── */

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { mode, next } = await searchParams;
  const activeMode: AuthMode = mode === "signup" ? "signup" : "login";
  const redirectTo = sanitizeRedirect(next);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_38%)] pt-28">
        <section className="container-shell grid min-h-[calc(100vh-112px)] gap-10 py-10 lg:grid-cols-2 lg:items-center">
          {/* ──── Left Side: Visual Panel ──── */}
          <div className="hidden lg:block">
            <div className="relative min-h-[620px] overflow-hidden rounded-[28px] border border-white/70 shadow-glass">
              <Image
                src="/images/footer-study-visual.png"
                alt="TOEIC Green focused study workspace"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-2 text-label-sm font-bold backdrop-blur-md">
                  <Sparkles className="h-4 w-4" />
                  TOEIC Green
                </div>
                <h1 className="max-w-sm text-[38px] font-extrabold leading-tight">
                  Học chắc hơn trước mỗi lần làm đề.
                </h1>
                <p className="mt-4 max-w-md text-body-md text-white/88">
                  Đăng nhập để lưu kết quả làm bài và tiếp tục luyện tập.
                </p>
              </div>
            </div>
          </div>

          {/* ──── Right Side: Auth Card (Client Component with animations) ──── */}
          <div className="flex justify-center">
            <AuthPanel initialMode={activeMode} redirectTo={redirectTo} />
          </div>
        </section>

        {/* ──── Benefit chips (mobile only) ──── */}
        <div className="container-shell flex flex-wrap items-center justify-center gap-3 pb-10 lg:hidden">
          {benefits.map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-white/70 px-4 py-2.5 text-label-sm font-bold text-on-surface-variant backdrop-blur-sm"
            >
              <b.icon className="h-4 w-4 text-primary" />
              {b.text}
            </span>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/* ─────────────────────── Utilities ─────────────────────── */

function sanitizeRedirect(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/practice";
  }
  return next;
}
