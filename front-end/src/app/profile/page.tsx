import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UserProfile } from "@/features/profile";

export const metadata: Metadata = {
  title: "Trang cá nhân | TOEIC Green"
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <UserProfile />
      </main>
      <SiteFooter />
    </>
  );
}
