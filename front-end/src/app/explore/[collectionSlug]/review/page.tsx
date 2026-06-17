import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ExploreVocabulary } from "@/features/explore";

type ExploreReviewPageProps = {
  params: Promise<{
    collectionSlug: string;
  }>;
};

export const metadata: Metadata = {
  title: "Luyện tập Flashcards | TOEIC Green"
};

export default async function ExploreReviewPage({
  params
}: ExploreReviewPageProps) {
  const { collectionSlug } = await params;

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <ExploreVocabulary
          initialCollectionSlug={collectionSlug}
          initialView="review"
        />
      </main>
      <SiteFooter />
    </>
  );
}
