import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  fetchPublicPracticeTest,
  fetchPublicPracticeTests
} from "@/features/practice/services/practice-server";
import { PracticeStartClient } from "./PracticeStartClient";

type TestStartPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Practice Test | TOEIC Green"
};

// Dựng sẵn trang cho từng đề công khai lúc build → phục vụ tĩnh + ISR, chịu tải
// tốt khi đông người. Slug lạ (đề thêm sau build) vẫn render on-demand mặc định.
export async function generateStaticParams() {
  const tests = (await fetchPublicPracticeTests()) ?? [];
  return tests.map((test) => ({ testId: test.id }));
}

export default async function TestStartPage({ params }: TestStartPageProps) {
  const { testId } = await params;
  // Server Component: nạp sẵn chi tiết đề công khai để paint tức thì (ISR 60s).
  const initialTest = await fetchPublicPracticeTest(testId);

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen" />}>
          <PracticeStartClient testId={testId} initialTest={initialTest} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
