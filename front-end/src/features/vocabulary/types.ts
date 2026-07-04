export type VocabularyStatus = "learning" | "mastered";

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase";

export type SortOption = "recent" | "az";

export type StatusFilter = "all" | VocabularyStatus | "favorites";

export type VocabularyWord = {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  example: string;
  exampleTranslation: string;
  tags: string[];
  status: VocabularyStatus;
  isFavorite: boolean;
  audioUrl?: string;
  addedAt: string;
  lastReviewedAt?: string;
};

export const STATUS_CONFIG: Record<
  VocabularyStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  mastered: {
    label: "Đã thuộc",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  learning: {
    label: "Đang học",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Mới thêm" },
  { value: "az", label: "Từ A → Z" },
];

export const POS_LABELS: Record<PartOfSpeech, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  phrase: "phr.",
};
