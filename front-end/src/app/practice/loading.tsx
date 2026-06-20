import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function PracticeLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-surface pb-20 pt-28">
        <div className="container-shell">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-pulse">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-200" />
                <div className="h-8 w-44 rounded bg-slate-200" />
              </div>
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
            </div>
            {/* Filter Buttons Skeleton */}
            <div className="h-11 w-64 rounded-xl bg-slate-200 shrink-0" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="glass-card flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 p-5 bg-white/40 animate-pulse"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-5 w-12 rounded bg-slate-200" />
                  <div className="h-5 w-16 rounded bg-slate-200" />
                </div>
                <div className="mb-2 h-6 w-3/4 rounded bg-slate-200" />
                <div className="mb-4 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mb-5 space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </div>
                <div className="mt-auto h-10 w-full rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
