import { api } from "@/lib/api";
import type { SavedPracticeResult } from "../lib/practice-progress";
import type { PracticeAttempt, PracticeTest } from "../lib/practice-tests";
import type { ToeicQuestion } from "../lib/toeic-questions";

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

export async function listPracticeTests() {
  return api.get<PracticeTest[]>("/practice/tests");
}

export async function getPracticeTest(testId: string) {
  return api.get<PracticeTest>(`/practice/tests/${encodeURIComponent(testId)}`);
}

export async function listPracticeQuestions(testId: string) {
  return api.get<ToeicQuestion[]>(
    `/practice/tests/${encodeURIComponent(testId)}/questions`
  );
}

export async function listRecentPracticeAttempts() {
  return api.get<PracticeAttempt[]>("/practice/attempts/recent");
}

export async function submitPracticeAttempt(
  testId: string,
  input: SubmitPracticeAttemptInput
) {
  return api.post<PracticeAttemptResult>(
    `/practice/tests/${encodeURIComponent(testId)}/attempts`,
    input
  );
}

export async function getPracticeAttemptResult(testId: string, attemptId: string) {
  return api.get<PracticeAttemptResult>(
    `/practice/tests/${encodeURIComponent(testId)}/attempts/${encodeURIComponent(attemptId)}`
  );
}

export async function getLatestPracticeAttemptResult(testId: string) {
  return api.get<PracticeAttemptResult>(
    `/practice/tests/${encodeURIComponent(testId)}/attempts/latest`
  );
}
