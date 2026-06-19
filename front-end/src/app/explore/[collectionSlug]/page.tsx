import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RequireAuth } from "@/features/auth";
import { ExploreVocabulary } from "@/features/explore";
import {
  fetchPublicExploreCollection,
  fetchPublicExploreCollections
} from "@/features/explore/services/explore-server";

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
  const [initialCollections, initialCollection] = await Promise.all([
    fetchPublicExploreCollections(),
    fetchPublicExploreCollection(collectionSlug)
  ]);

  return (
    <>
      <SiteHeader />
      <main className="pt-20">
        <Suspense fallback={<div className="min-h-screen bg-[#f5f7f9]" />}>
          <RequireAuth>
            <ExploreVocabulary
              initialCollection={initialCollection}
              initialCollections={initialCollections}
              initialCollectionSlug={collectionSlug}
            />
          </RequireAuth>
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
