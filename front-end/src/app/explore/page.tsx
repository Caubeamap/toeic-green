import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ExploreVocabulary } from "@/features/explore";

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <ExploreVocabulary />
      </main>
      <SiteFooter />
    </>
  );
}
