import type { PracticeAttempt, PracticeTest } from "@/lib/practice-tests";

export const LATEST_PRACTICE_RESULT_KEY = "toeic-test-result";

const PRACTICE_ATTEMPTS_KEY = "toeic-practice-attempts";
const MAX_STORED_ATTEMPTS = 50;

export type SavedPracticeResult = {
  testId: string;
  testTitle: string;
  correct: number;
  total: number;
  answered: number;
  flagged: number;
  flaggedIds?: string[];
  duration: number;
  answers: Record<string, string>;
  timestamp: string;
};

export type StoredPracticeAttempt = PracticeAttempt & {
  testId: string;
  testTitle: string;
  timestamp: string;
  result: SavedPracticeResult;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function formatAttemptDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getAttemptMode(test: PracticeTest, result: SavedPracticeResult): PracticeAttempt["mode"] {
  return result.total >= test.questions ? "Full test" : "Practice";
}

function getAttemptScopeLabels(test: PracticeTest, result: SavedPracticeResult) {
  if (result.total >= test.questions) {
    return ["Full test"];
  }

  return [test.shortType];
}

function toPracticeAttempt(test: PracticeTest, result: SavedPracticeResult): StoredPracticeAttempt {
  const timestamp = result.timestamp || new Date().toISOString();
  const attemptedAt = formatAttemptDate(timestamp);
  const attemptId = `${test.id}-${new Date(timestamp).getTime() || Date.now()}`;

  return {
    id: attemptId,
    testId: test.id,
    testTitle: `${test.title} ${test.subtitle}`,
    attemptedAt,
    mode: getAttemptMode(test, result),
    scopeLabels: getAttemptScopeLabels(test, result),
    correct: result.correct,
    total: result.total,
    durationSeconds: result.duration,
    detailHref: `/practice/${test.id}/results/latest`,
    timestamp,
    result
  };
}

export function loadPracticeAttempts(): StoredPracticeAttempt[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PRACTICE_ATTEMPTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((attempt): attempt is StoredPracticeAttempt => {
      return (
        typeof attempt?.id === "string" &&
        typeof attempt?.testId === "string" &&
        typeof attempt?.timestamp === "string" &&
        typeof attempt?.result === "object"
      );
    });
  } catch (error) {
    console.error("Failed to load practice attempts", error);
    return [];
  }
}

export function savePracticeAttemptResult(test: PracticeTest, result: SavedPracticeResult) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    const attempt = toPracticeAttempt(test, result);
    const storedAttempts = loadPracticeAttempts();
    const nextAttempts = [
      attempt,
      ...storedAttempts.filter((item) => item.id !== attempt.id)
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_STORED_ATTEMPTS);

    window.localStorage.setItem(PRACTICE_ATTEMPTS_KEY, JSON.stringify(nextAttempts));
  } catch (error) {
    console.error("Failed to save practice attempt", error);
  }
}

export function getLatestPracticeResult(testId: string) {
  return loadPracticeAttempts().find((attempt) => attempt.testId === testId)?.result ?? null;
}

export function mergePracticeProgress(tests: PracticeTest[]): PracticeTest[] {
  const attempts = loadPracticeAttempts();

  if (attempts.length === 0) {
    return tests;
  }

  const attemptsByTest = new Map<string, StoredPracticeAttempt[]>();

  attempts.forEach((attempt) => {
    const current = attemptsByTest.get(attempt.testId) ?? [];
    attemptsByTest.set(attempt.testId, [...current, attempt]);
  });

  return tests.map((test) => {
    const testAttempts = attemptsByTest.get(test.id);

    if (!testAttempts?.length) {
      return test;
    }

    const sortedAttempts = [...testAttempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestAttempt = sortedAttempts[0];

    return {
      ...test,
      status: "Completed",
      recentAttempts: sortedAttempts,
      completedAt: latestAttempt.attemptedAt
    };
  });
}
