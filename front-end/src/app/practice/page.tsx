import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PracticeCatalog } from "@/features/practice";
import { fetchPublicPracticeTests } from "@/features/practice/services/practice-server";

export default async function PracticePage() {
  // Server Component: nạp sẵn danh sách đề công khai để paint tức thì (ISR 60s).
  const initialTests = await fetchPublicPracticeTests();

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen" />}>
          <PracticeCatalog initialTests={initialTests} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
