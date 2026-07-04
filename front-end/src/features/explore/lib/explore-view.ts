import { CheckCircle2, Smile, ThumbsUp, XCircle } from "lucide-react";
import type {
  ExploreCollection,
  ExploreCollectionSummary,
  ExploreProgress,
  FlashcardRating
} from "../types";

export type ExploreView = "collections" | "detail" | "review";
export type LoadStatus = "idle" | "loading" | "ready" | "error";

export const ratingActions: {
  rating: FlashcardRating;
  label: string;
  icon: typeof Smile;
  className: string;
}[] = [
  {
    rating: "easy",
    label: "Dễ",
    icon: Smile,
    className: "text-emerald-700 hover:bg-emerald-50"
  },
  {
    rating: "medium",
    label: "Trung bình",
    icon: ThumbsUp,
    className: "text-amber-700 hover:bg-amber-50"
  },
  {
    rating: "hard",
    label: "Khó",
    icon: XCircle,
    className: "text-rose-700 hover:bg-rose-50"
  },
  {
    rating: "known",
    label: "Đã biết",
    icon: CheckCircle2,
    className: "text-blue-700 hover:bg-blue-50"
  }
];

export const emptyProgress: ExploreProgress = {
  savedCollectionIds: [],
  studyingCollectionIds: [],
  ratingsByWordId: {}
};

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export type WordLearnStatus = "known" | "learning" | "new";
export type WordFilter = "all" | WordLearnStatus;

/** Suy ra trạng thái học của 1 từ từ rating đã lưu. */
export function getWordStatus(rating: FlashcardRating | undefined): WordLearnStatus {
  if (rating === "known") return "known";
  if (rating) return "learning"; // easy / medium / hard = đang ôn
  return "new";
}

export const STATUS_BADGE: Record<
  WordLearnStatus,
  { label: string; className: string }
> = {
  known: {
    label: "Đã biết",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  learning: {
    label: "Đang ôn",
    className: "border-amber-200 bg-amber-50 text-amber-700"
  },
  new: {
    label: "Chưa học",
    className: "border-slate-200 bg-slate-50 text-slate-500"
  }
};

export const WORD_FILTERS: { key: WordFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Chưa học" },
  { key: "learning", label: "Đang ôn" },
  { key: "known", label: "Đã biết" }
];

export function getCollectionRouteId(collection: ExploreCollectionSummary) {
  return collection.slug || collection.id;
}

export function getCollectionHref(collection: ExploreCollectionSummary) {
  return `/explore/${encodeURIComponent(getCollectionRouteId(collection))}`;
}

export function summaryFromCollection(
  collection: ExploreCollection
): ExploreCollectionSummary {
  const { words, ...summary } = collection;
  void words;
  return summary;
}

export function findCollectionByRouteId(
  collections: ExploreCollectionSummary[],
  routeId: string
) {
  return collections.find(
    (collection) => collection.id === routeId || collection.slug === routeId
  );
}
