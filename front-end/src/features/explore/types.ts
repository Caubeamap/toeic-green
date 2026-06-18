import type { PartOfSpeech } from "@/features/vocabulary/types";

export type FlashcardRating = "easy" | "medium" | "hard" | "known";

export type ExploreWord = {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  example: string;
  exampleTranslation: string;
  imageUrl?: string;
  audioUrl?: string;
  examples?: Array<{
    text: string;
    translation: string;
  }>;
};

export type ExploreCollectionSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  author: string;
  wordCount: number;
  estimatedMinutes: number;
  tags: string[];
  coverImageUrl?: string;
  sourceUrl?: string;
};

export type ExploreCollection = ExploreCollectionSummary & {
  words: ExploreWord[];
};

export type ExploreProgress = {
  savedCollectionIds: string[];
  studyingCollectionIds: string[];
  activeCollectionId?: string;
  ratingsByWordId: Record<string, FlashcardRating>;
  lastStudiedAt?: string;
};

/** Response của GET /explore/collections/:slug/progress */
export type CollectionProgressResponse = {
  isSaved: boolean;
  isStudying: boolean;
  lastStudiedAt: string | null;
  ratings: Record<string, FlashcardRating>;
};
