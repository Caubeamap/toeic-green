import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ExploreVocabulary } from "@/features/explore";

type ExploreCollectionPageProps = {
  params: Promise<{
    collectionSlug: string;
  }>;
};

export const metadata: Metadata = {
  title: "Flashcards | TOEIC Green"
};

export default async function ExploreCollectionPage({
  params
}: ExploreCollectionPageProps) {
  const { collectionSlug } = await params;

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <ExploreVocabulary initialCollectionSlug={collectionSlug} />
      </main>
      <SiteFooter />
    </>
  );
}
