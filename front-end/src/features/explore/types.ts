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
  imageUrl: string;
  audioUrl?: string;
};

export type ExploreCollection = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  author: string;
  wordCount: number;
  learners: number;
  estimatedMinutes: number;
  tags: string[];
  words: ExploreWord[];
};

export type ExploreProgress = {
  savedCollectionIds: string[];
  studyingCollectionIds: string[];
  activeCollectionId?: string;
  ratingsByWordId: Record<string, FlashcardRating>;
  lastStudiedAt?: string;
};
