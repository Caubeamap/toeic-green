import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProgressOverview } from "@/components/progress/ProgressOverview";

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
