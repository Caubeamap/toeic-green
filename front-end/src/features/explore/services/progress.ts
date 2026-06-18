import { api } from "@/lib/api";
import type { CollectionProgressResponse, FlashcardRating } from "../types";

/** Lấy tiến độ học của user hiện tại cho 1 bộ từ (yêu cầu đăng nhập). */
export function fetchCollectionProgress(
  slug: string
): Promise<CollectionProgressResponse> {
  return api.get<CollectionProgressResponse>(
    `/explore/collections/${encodeURIComponent(slug)}/progress`
  );
}

/** Ghi nhận rating của 1 từ. */
export function rateWord(
  wordId: string,
  rating: FlashcardRating
): Promise<{ ok: boolean; wordId: string; rating: FlashcardRating }> {
  return api.put(`/explore/words/${encodeURIComponent(wordId)}/rating`, {
    rating
  });
}

/** Reset toàn bộ từ "đã biết" của 1 bộ để ôn lại. */
export function resetKnownRatings(
  slug: string
): Promise<{ reset: number }> {
  return api.delete(
    `/explore/collections/${encodeURIComponent(slug)}/known`
  );
}

/** Lưu / bỏ lưu (bookmark) 1 bộ từ. */
export function setCollectionSaved(
  slug: string,
  isSaved: boolean
): Promise<{ isSaved: boolean }> {
  return api.put(
    `/explore/collections/${encodeURIComponent(slug)}/saved`,
    { isSaved }
  );
}
