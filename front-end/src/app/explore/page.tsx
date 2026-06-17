import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ExploreVocabulary } from "@/features/explore";

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen bg-[#f5f7f9]" />}>
          <ExploreVocabulary />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
