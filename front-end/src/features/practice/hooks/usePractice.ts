"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/auth";
import {
  getLatestPracticeAttemptResult,
  getPracticeAttemptResult,
  getPracticeStats,
  getPracticeTest,
  getPracticeTestWithProgress,
  listPracticeQuestions,
  listPracticeTests,
  listPracticeTestsWithProgress,
  listRecentPracticeAttempts,
  submitPracticeAttempt,
  type SubmitPracticeAttemptInput
} from "../services/practice-api";

/* Query keys tập trung — đổi/invalidate ở một chỗ. Biến thể public vs user dùng
 * scope khác nhau để không lẫn dữ liệu khách và dữ liệu đã đăng nhập. */
export const practiceKeys = {
  tests: (scope: string) => ["practice", "tests", scope] as const,
  test: (slug: string, scope: string) =>
    ["practice", "test", slug, scope] as const,
  questions: (slug: string) => ["practice", "questions", slug] as const,
  stats: (userId?: string) => ["practice", "stats", userId] as const,
  recent: (userId?: string) => ["practice", "recent", userId] as const,
  attempt: (slug: string, attemptId: string) =>
    ["practice", "attempt", slug, attemptId] as const,
  latest: (slug: string) => ["practice", "attempt", slug, "latest"] as const
};

function scopeFor(isAuthenticated: boolean, userId?: string) {
  return isAuthenticated ? `user:${userId}` : "public";
}

/** Danh mục đề: chờ auth xác định rồi chọn biến thể public / kèm tiến độ. */
export function usePracticeCatalog() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const query = useQuery({
    queryKey: practiceKeys.tests(scopeFor(isAuthenticated, user?.id)),
    queryFn: () =>
      isAuthenticated ? listPracticeTestsWithProgress() : listPracticeTests(),
    enabled: !authLoading
  });

  return {
    tests: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    error: query.error as Error | null
  };
}

/** Chi tiết một đề (trang chuẩn bị): public hoặc kèm tiến độ tuỳ đăng nhập. */
export function usePracticeTestDetail(slug: string) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const query = useQuery({
    queryKey: practiceKeys.test(slug, scopeFor(isAuthenticated, user?.id)),
    queryFn: () =>
      isAuthenticated
        ? getPracticeTestWithProgress(slug)
        : getPracticeTest(slug),
    enabled: !authLoading && Boolean(slug)
  });

  return {
    test: query.data ?? null,
    isLoading: authLoading || query.isLoading,
    error: query.error as Error | null
  };
}

/** Đề công khai (dùng cho màn làm bài — câu hỏi yêu cầu đăng nhập riêng). */
export function usePracticeTest(slug: string) {
  return useQuery({
    queryKey: practiceKeys.test(slug, "public"),
    queryFn: () => getPracticeTest(slug),
    enabled: Boolean(slug)
  });
}

/** Câu hỏi của đề (cache lâu — câu hỏi gần như tĩnh). */
export function usePracticeQuestions(slug: string, enabled = true) {
  return useQuery({
    queryKey: practiceKeys.questions(slug),
    queryFn: () => listPracticeQuestions(slug),
    enabled: enabled && Boolean(slug),
    staleTime: 10 * 60_000
  });
}

export function usePracticeStats() {
  const { isAuthenticated, user } = useAuth();
  return useQuery({
    queryKey: practiceKeys.stats(user?.id),
    queryFn: getPracticeStats,
    enabled: isAuthenticated && Boolean(user?.id)
  });
}

export function useRecentAttempts() {
  const { isAuthenticated, user } = useAuth();
  return useQuery({
    queryKey: practiceKeys.recent(user?.id),
    queryFn: listRecentPracticeAttempts,
    enabled: isAuthenticated && Boolean(user?.id)
  });
}

export function useAttemptResult(slug: string, attemptId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: practiceKeys.attempt(slug, attemptId),
    queryFn: () => getPracticeAttemptResult(slug, attemptId),
    enabled: isAuthenticated && Boolean(slug) && Boolean(attemptId),
    // Bài đã nộp là bất biến → coi là tươi lâu, khỏi refetch khi quay lại.
    staleTime: 5 * 60_000,
    retry: false
  });
}

export function useLatestAttemptResult(slug: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: practiceKeys.latest(slug),
    queryFn: () => getLatestPracticeAttemptResult(slug),
    enabled: isAuthenticated && Boolean(slug),
    staleTime: 5 * 60_000,
    retry: false
  });
}

/** Cho phép prefetch câu hỏi (vd khi mở trang chuẩn bị) để vào thi tức thì. */
export function usePrefetchQuestions() {
  const qc = useQueryClient();
  return (slug: string) =>
    qc.prefetchQuery({
      queryKey: practiceKeys.questions(slug),
      queryFn: () => listPracticeQuestions(slug),
      staleTime: 10 * 60_000
    });
}

/**
 * Nộp bài: thành công thì seed cache kết quả (trang kết quả vào là tức thì) và
 * invalidate danh mục/stats/recent để các màn khác cập nhật trạng thái.
 */
export function useSubmitAttempt(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitPracticeAttemptInput) =>
      submitPracticeAttempt(slug, input),
    onSuccess: (result) => {
      qc.setQueryData(practiceKeys.attempt(slug, result.attempt.id), result);
      qc.setQueryData(practiceKeys.latest(slug), result);
      qc.invalidateQueries({ queryKey: ["practice", "tests"] });
      qc.invalidateQueries({ queryKey: ["practice", "stats"] });
      qc.invalidateQueries({ queryKey: ["practice", "recent"] });
    }
  });
}
