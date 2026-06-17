import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { VocabularyNotebook } from "@/features/vocabulary";

export default function VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen bg-surface" />}>
          <VocabularyNotebook />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
