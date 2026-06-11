import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { VocabularyNotebook } from "@/components/vocabulary/VocabularyNotebook";

export default function VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <VocabularyNotebook />
      </main>
      <SiteFooter />
    </>
  );
}
