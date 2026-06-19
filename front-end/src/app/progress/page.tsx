import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RequireAuth } from "@/features/auth";
import { ProgressOverview } from "@/features/progress";

export default function ProgressPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen bg-surface" />}>
          <RequireAuth>
            <ProgressOverview />
          </RequireAuth>
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
