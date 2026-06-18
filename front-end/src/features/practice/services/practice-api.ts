import { api } from "@/lib/api";
import type { SavedPracticeResult } from "../lib/practice-progress";
import type { PracticeAttempt, PracticeTest } from "../lib/practice-tests";
import type { ToeicQuestion } from "../lib/toeic-questions";

/* Lớp gọi API thuần (queryFn/mutationFn). Cache do React Query quản lý trong RAM
 * (xem features/practice/hooks/usePractice.ts) — KHÔNG persist xuống localStorage. */

export type PracticeAttemptResult = {
  test: PracticeTest;
  attempt: PracticeAttempt;
  questions: ToeicQuestion[];
  result: SavedPracticeResult;
};

export type SubmitPracticeAttemptInput = {
  mode: "PRACTICE" | "FULL_TEST";
  durationSeconds: number;
  timeLimitMinutes: number;
  questionIds: string[];
  answers: Record<string, string>;
  flaggedQuestionIds?: string[];
};

export type PracticeStats = {
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  averageAccuracy: number | null;
  bestAccuracy: number | null;
  bestScaledScore: number | null;
};

const enc = encodeURIComponent;

export function listPracticeTests() {
  return api.get<PracticeTest[]>("/practice/tests");
}

export function listPracticeTestsWithProgress() {
  return api.get<PracticeTest[]>("/practice/tests/me");
}

export function getPracticeTest(testId: string) {
  return api.get<PracticeTest>(`/practice/tests/${enc(testId)}`);
}

export function getPracticeTestWithProgress(testId: string) {
  return api.get<PracticeTest>(`/practice/tests/${enc(testId)}/progress`);
}

export function listPracticeQuestions(testId: string) {
  return api.get<ToeicQuestion[]>(`/practice/tests/${enc(testId)}/questions`);
}

export function listRecentPracticeAttempts() {
  return api.get<PracticeAttempt[]>("/practice/attempts/recent");
}

export function getPracticeStats() {
  return api.get<PracticeStats>("/practice/stats/me");
}

export function submitPracticeAttempt(
  testId: string,
  input: SubmitPracticeAttemptInput
) {
  return api.post<PracticeAttemptResult>(
    `/practice/tests/${enc(testId)}/attempts`,
    input
  );
}

export function getPracticeAttemptResult(testId: string, attemptId: string) {
  return api.get<PracticeAttemptResult>(
    `/practice/tests/${enc(testId)}/attempts/${enc(attemptId)}`
  );
}

export function getLatestPracticeAttemptResult(testId: string) {
  return api.get<PracticeAttemptResult>(
    `/practice/tests/${enc(testId)}/attempts/latest`
  );
}
