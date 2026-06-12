import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EditProfileForm } from "@/features/profile";

export const metadata: Metadata = {
  title: "Cập nhật thông tin cá nhân | TOEIC Green"
};

export default function EditProfilePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EditProfileForm />
      </main>
      <SiteFooter />
    </>
  );
}
