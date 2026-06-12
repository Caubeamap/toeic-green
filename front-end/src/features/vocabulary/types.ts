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
  note?: string;
  audioUrl?: string;
  addedAt: string;
  lastReviewedAt?: string;
  reviewCount: number;
};

export const TOEIC_TAGS = [
  "All",
  "Business",
  "Office",
  "Travel",
  "Finance",
  "Meeting",
  "Email",
  "Contract",
  "Customer Service",
] as const;

export type ToeicTag = (typeof TOEIC_TAGS)[number];

export const STATUS_CONFIG: Record<
  VocabularyStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  mastered: {
    label: "Mastered",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  learning: {
    label: "Learning",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "az", label: "A → Z" },
];

export const POS_LABELS: Record<PartOfSpeech, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  phrase: "phr.",
};
