import type { FlashcardRating } from "../types";

/* Tiến độ Explore (saved/studying/ratings) đã chuyển sang lưu ở DB qua
 * services/progress.ts — không còn localStorage. Dưới đây chỉ là các helper
 * thuần cho thao tác mảng/ratings trên UI. */

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
