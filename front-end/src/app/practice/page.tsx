import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PracticeCatalog } from "@/features/practice";

export default function PracticePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <PracticeCatalog />
      </main>
      <SiteFooter />
    </>
  );
}
