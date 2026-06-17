import type { Metadata } from "next";
import { Suspense } from "react";
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
        <Suspense fallback={<div className="min-h-screen bg-[#f5f7f9]" />}>
          <ExploreVocabulary
            initialCollectionSlug={collectionSlug}
            initialView="review"
          />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
