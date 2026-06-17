import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function PracticeStartLoading() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-on-surface-variant">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm font-semibold">Đang tải đề thi…</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
