import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function PracticeStartLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-surface pb-20 pt-28">
        <div className="container-shell animate-pulse">
          {/* Back button skeleton */}
          <div className="h-4 w-28 rounded bg-slate-200" />
          
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              {/* Test Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="h-8 w-64 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-40 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded bg-slate-100" />
              </div>
              
              {/* Tabs */}
              <div className="mt-6 flex gap-4 border-b border-zinc-200 pb-2">
                <div className="h-6 w-20 rounded bg-slate-200" />
                <div className="h-6 w-28 rounded bg-slate-200" />
                <div className="h-6 w-24 rounded bg-slate-200" />
              </div>
              
              {/* Setup panel */}
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
                <div className="h-6 w-44 rounded bg-slate-200" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="h-14 rounded-xl bg-slate-100" />
                  <div className="h-14 rounded-xl bg-slate-100" />
                  <div className="h-14 rounded-xl bg-slate-100" />
                  <div className="h-14 rounded-xl bg-slate-100" />
                </div>
                <div className="mt-6 h-10 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
            
            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="h-6 w-32 rounded bg-slate-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-5/6 rounded bg-slate-100" />
                  <div className="h-4 w-4/5 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
