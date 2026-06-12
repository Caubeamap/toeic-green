import type { ExploreProgress, FlashcardRating } from "../types";

const EXPLORE_PROGRESS_KEY = "toeic-green-explore-progress";

const DEFAULT_PROGRESS: ExploreProgress = {
  savedCollectionIds: [],
  studyingCollectionIds: [],
  ratingsByWordId: {}
};

export function loadExploreProgress(): ExploreProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;

  try {
    const raw = window.localStorage.getItem(EXPLORE_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;

    const parsed = JSON.parse(raw) as ExploreProgress;
    return {
      savedCollectionIds: Array.isArray(parsed.savedCollectionIds)
        ? parsed.savedCollectionIds
        : [],
      studyingCollectionIds: Array.isArray(parsed.studyingCollectionIds)
        ? parsed.studyingCollectionIds
        : [],
      activeCollectionId: parsed.activeCollectionId,
      ratingsByWordId:
        parsed.ratingsByWordId && typeof parsed.ratingsByWordId === "object"
          ? parsed.ratingsByWordId
          : {},
      lastStudiedAt: parsed.lastStudiedAt
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveExploreProgress(progress: ExploreProgress): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      EXPLORE_PROGRESS_KEY,
      JSON.stringify({
        ...progress,
        lastStudiedAt: new Date().toISOString()
      })
    );
  } catch {
    // Storage can be unavailable; the UI can still work for the current session.
  }
}

export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function setWordRating(
  ratings: Record<string, FlashcardRating>,
  wordId: string,
  rating: FlashcardRating
) {
  return {
    ...ratings,
    [wordId]: rating
  };
}
