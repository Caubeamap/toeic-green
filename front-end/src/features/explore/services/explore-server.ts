import type { ExploreCollection, ExploreCollectionSummary } from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

export async function fetchPublicExploreCollections(): Promise<
  ExploreCollectionSummary[] | undefined
> {
  try {
    const response = await fetch(`${API_URL}/explore/collections`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) return undefined;
    return (await response.json()) as ExploreCollectionSummary[];
  } catch {
    return undefined;
  }
}

export async function fetchPublicExploreCollection(
  slug: string
): Promise<ExploreCollection | undefined> {
  try {
    const response = await fetch(
      `${API_URL}/explore/collections/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return undefined;
    return (await response.json()) as ExploreCollection;
  } catch {
    return undefined;
  }
}
