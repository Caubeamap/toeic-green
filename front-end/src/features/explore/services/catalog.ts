import { api } from "@/lib/api";
import type { ExploreCollection, ExploreCollectionSummary } from "../types";

const collectionCache = new Map<string, Promise<ExploreCollection>>();
let catalogCache: Promise<ExploreCollectionSummary[]> | null = null;

export function loadExploreCollections(): Promise<ExploreCollectionSummary[]> {
  catalogCache ??= api.get<ExploreCollectionSummary[]>("/explore/collections");

  return catalogCache;
}

export function loadExploreCollection(
  summary: ExploreCollectionSummary
): Promise<ExploreCollection> {
  const cached = collectionCache.get(summary.id);
  if (cached) return cached;

  const request = api.get<ExploreCollection>(
    `/explore/collections/${encodeURIComponent(summary.slug)}`
  );

  collectionCache.set(summary.id, request);
  return request;
}
