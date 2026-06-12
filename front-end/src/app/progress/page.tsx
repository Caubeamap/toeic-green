import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProgressOverview } from "@/features/progress";

export default function ProgressPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <ProgressOverview />
      </main>
      <SiteFooter />
    </>
  );
}
