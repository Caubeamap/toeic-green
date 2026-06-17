import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PracticeCatalog } from "@/features/practice";

export default function PracticePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen" />}>
          <PracticeCatalog />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
