import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu | TOEIC Green",
  description: "Yêu cầu liên kết đặt lại mật khẩu tài khoản TOEIC Green của bạn."
};

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_48%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_40%)] px-4 py-32">
        <ForgotPasswordForm />
      </main>
      <SiteFooter />
    </>
  );
}
