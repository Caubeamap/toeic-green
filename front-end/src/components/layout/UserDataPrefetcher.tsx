"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { practiceKeys } from "@/features/practice/hooks/usePractice";
import {
  getPracticeStats,
  listPracticeTestsWithProgress,
  listRecentPracticeAttempts
} from "@/features/practice/services/practice-api";
import { vocabularyQueryKey } from "@/features/vocabulary/hooks/useVocabulary";
import { fetchVocabularyWords } from "@/features/vocabulary/services/api";

/**
 * Khi user vừa đăng nhập HOẶC vừa khôi phục phiên (warm-start/F5), nạp sẵn vào
 * cache React Query (RAM) toàn bộ dữ liệu theo-user mà các trang chính cần, NGAY ở
 * nền — để khi điều hướng tới `/practice`, `/progress`, `/profile`, `/vocabulary`
 * thì dữ liệu đã có sẵn, hiển thị gần như tức thì thay vì chờ round-trip lúc vào trang.
 *
 * Đặc biệt khắc phục hiện tượng `/practice` thoáng hiện "Bắt đầu làm" rồi mới lật
 * sang "Đã hoàn thành": catalog-kèm-tiến-độ (`/practice/tests/me`) được prefetch
 * sẵn nên trùng cache key của `usePracticeCatalog`, không còn cửa sổ chờ.
 *
 * Không persist xuống storage (chỉ RAM); chạy lại khi user đổi (đăng nhập tài khoản
 * khác). prefetchQuery tôn trọng staleTime → không refetch nếu dữ liệu còn tươi.
 */
export function UserDataPrefetcher() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Fire-and-forget, song song. Lỗi (vd mạng) không cản UI — trang vẫn tự fetch lại.
    void queryClient.prefetchQuery({
      queryKey: practiceKeys.tests(`user:${userId}`),
      queryFn: listPracticeTestsWithProgress
    });
    void queryClient.prefetchQuery({
      queryKey: practiceKeys.stats(userId),
      queryFn: getPracticeStats
    });
    void queryClient.prefetchQuery({
      queryKey: practiceKeys.recent(userId),
      queryFn: listRecentPracticeAttempts
    });
    void queryClient.prefetchQuery({
      queryKey: vocabularyQueryKey(userId),
      queryFn: fetchVocabularyWords
    });
  }, [isAuthenticated, userId, queryClient]);

  return null;
}
