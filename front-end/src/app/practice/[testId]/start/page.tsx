import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PracticeStartClient } from "./PracticeStartClient";

type TestStartPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Practice Test | TOEIC Green"
};

export default async function TestStartPage({ params }: TestStartPageProps) {
  const { testId } = await params;

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen" />}>
          <PracticeStartClient testId={testId} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
