import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { VerifyEmailPanel } from "@/features/auth/components/VerifyEmailPanel";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Xác minh email | TOEIC Green",
  description: "Xác minh địa chỉ email cho tài khoản TOEIC Green."
};

export default async function VerifyEmailPage({
  searchParams
}: VerifyEmailPageProps) {
  const { email = "", token = "" } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_48%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_40%)] px-4 py-32">
        <VerifyEmailPanel initialEmail={email} token={token} />
      </main>
      <SiteFooter />
    </>
  );
}
