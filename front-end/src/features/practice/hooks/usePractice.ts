"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/auth";
import type { PracticeTest } from "../lib/practice-tests";
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

/**
 * Danh mục đề (hybrid SSR + client):
 * - Public list dùng `initialData` từ Server Component → hiển thị TỨC THÌ trong
 *   HTML, không skeleton, không localStorage.
 * - Nếu đã đăng nhập, query "kèm tiến độ" (`/tests/me`) phủ lên để hiện trạng
 *   thái Completed / lịch sử mà không chặn lần paint đầu.
 */
export function usePracticeCatalog(
  initialTests?: PracticeTest[],
  initialProgressTests?: PracticeTest[],
) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userId = user?.id;

  const publicQuery = useQuery({
    queryKey: practiceKeys.tests("public"),
    queryFn: listPracticeTests,
    initialData: initialTests
  });

  const progressQuery = useQuery({
    queryKey: practiceKeys.tests(scopeFor(true, userId)),
    queryFn: listPracticeTestsWithProgress,
    enabled: isAuthenticated && Boolean(userId),
    initialData: initialProgressTests,
    refetchOnMount: "always"
  });

  const tests = progressQuery.data ?? publicQuery.data ?? [];
  const isUserProgressPending =
    !progressQuery.data &&
    (authLoading || (isAuthenticated && progressQuery.isFetching));

  return {
    tests,
    isUserProgressPending,
    // Chỉ "đang tải" khi thật sự chưa có gì để hiển thị (vd SSR fail + guest).
    isLoading: tests.length === 0 && publicQuery.isLoading,
    error: (publicQuery.error ?? progressQuery.error) as Error | null
  };
}

/**
 * Chi tiết một đề (trang chuẩn bị) — hybrid như trên: public từ SSR hiển thị
 * ngay, tiến độ (recentAttempts) phủ lên khi đã đăng nhập.
 */
export function usePracticeTestDetail(
  slug: string,
  initialTest?: PracticeTest
) {
  const { isAuthenticated, user } = useAuth();

  const publicQuery = useQuery({
    queryKey: practiceKeys.test(slug, "public"),
    queryFn: () => getPracticeTest(slug),
    initialData: initialTest,
    enabled: Boolean(slug)
  });

  const progressQuery = useQuery({
    queryKey: practiceKeys.test(slug, scopeFor(true, user?.id)),
    queryFn: () => getPracticeTestWithProgress(slug),
    enabled: isAuthenticated && Boolean(user?.id) && Boolean(slug)
  });

  const test = progressQuery.data ?? publicQuery.data ?? null;

  return {
    test,
    isLoading: !test && publicQuery.isLoading,
    error: (publicQuery.error ?? progressQuery.error) as Error | null
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
