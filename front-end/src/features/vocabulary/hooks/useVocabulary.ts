"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/auth";
import {
  createVocabularyWord,
  deleteVocabularyWord,
  fetchVocabularyWords,
  updateVocabularyWord,
  type VocabularyInput
} from "../services/api";
import type { VocabularyStatus, VocabularyWord } from "../types";

/** Query key dùng chung cho sổ từ vựng (notebook + progress chia sẻ cache). */
export function vocabularyQueryKey(userId: string | undefined) {
  return ["vocabulary", userId] as const;
}

/** Query thuần: danh sách từ vựng của user hiện tại (cache trong RAM). */
export function useVocabularyWords() {
  const { user, isApiReady } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: vocabularyQueryKey(userId),
    queryFn: fetchVocabularyWords,
    enabled: isApiReady && Boolean(userId)
  });
}

/**
 * Sổ từ vựng đầy đủ cho notebook: query + các thao tác CRUD cập nhật thẳng vào
 * cache React Query (optimistic cho toggle/xoá, await cho thêm/sửa để bắt lỗi).
 * Không còn localStorage — cache nằm trong RAM và tự revalidate.
 */
export function useVocabulary() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isLoading } = useVocabularyWords();
  const words = data ?? [];

  const patchCache = useCallback(
    (updater: (prev: VocabularyWord[]) => VocabularyWord[]) =>
      qc.setQueryData<VocabularyWord[]>(vocabularyQueryKey(userId), (prev) =>
        updater(prev ?? [])
      ),
    [qc, userId]
  );

  const readCache = useCallback(
    () => qc.getQueryData<VocabularyWord[]>(vocabularyQueryKey(userId)) ?? [],
    [qc, userId]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const target = readCache().find((w) => w.id === id);
      if (!target) return;

      const next = !target.isFavorite;
      patchCache((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isFavorite: next } : w))
      );
      void updateVocabularyWord(id, { isFavorite: next }).catch(() => {
        patchCache((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, isFavorite: target.isFavorite } : w
          )
        );
      });
    },
    [patchCache, readCache]
  );

  const toggleMastered = useCallback(
    (id: string) => {
      const target = readCache().find((w) => w.id === id);
      if (!target) return;

      const nextStatus: VocabularyStatus =
        target.status === "mastered" ? "learning" : "mastered";
      const reviewedAt = new Date().toISOString();
      patchCache((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, status: nextStatus, lastReviewedAt: reviewedAt }
            : w
        )
      );
      void updateVocabularyWord(id, { status: nextStatus }).catch(() => {
        patchCache((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: target.status,
                  lastReviewedAt: target.lastReviewedAt
                }
              : w
          )
        );
      });
    },
    [patchCache, readCache]
  );

  // Thêm/sửa: await server rồi đồng bộ cache; lỗi ném ra cho modal/drawer hiển thị.
  const addWord = useCallback(
    async (input: VocabularyInput) => {
      const created = await createVocabularyWord(input);
      patchCache((prev) => [created, ...prev]);
    },
    [patchCache]
  );

  const updateWord = useCallback(
    async (id: string, patch: Partial<VocabularyInput>) => {
      const updated = await updateVocabularyWord(id, patch);
      patchCache((prev) => prev.map((w) => (w.id === id ? updated : w)));
    },
    [patchCache]
  );

  const deleteWord = useCallback(
    (id: string) => {
      const snapshot = readCache();
      patchCache((prev) => prev.filter((w) => w.id !== id));
      void deleteVocabularyWord(id).catch(() => {
        patchCache(() => snapshot);
      });
    },
    [patchCache, readCache]
  );

  return {
    words,
    isLoading,
    toggleFavorite,
    toggleMastered,
    addWord,
    updateWord,
    deleteWord
  };
}
