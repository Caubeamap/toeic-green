import type { PracticeAttempt } from "./practice-tests";

const LATEST_PRACTICE_RESULT_KEY = "toeic-test-result";

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
  parts?: string[];
  timeLimit?: number;
};

export type StoredPracticeAttempt = PracticeAttempt & {
  testId: string;
  testTitle: string;
  timestamp: string;
  result: SavedPracticeResult;
};

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function canUseBrowserStorage() {
  return Boolean(getSessionStorage());
}

function getTimestampValue(timestamp: string) {
  const time = new Date(timestamp).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isStoredPracticeAttempt(attempt: unknown): attempt is StoredPracticeAttempt {
  if (!attempt || typeof attempt !== "object") {
    return false;
  }

  const item = attempt as Partial<StoredPracticeAttempt>;

  return (
    typeof item.id === "string" &&
    typeof item.testId === "string" &&
    typeof item.testTitle === "string" &&
    typeof item.timestamp === "string" &&
    typeof item.attemptedAt === "string" &&
    typeof item.mode === "string" &&
    Array.isArray(item.scopeLabels) &&
    typeof item.correct === "number" &&
    typeof item.total === "number" &&
    typeof item.durationSeconds === "number" &&
    typeof item.detailHref === "string" &&
    typeof item.result === "object" &&
    item.result !== null
  );
}

function clearPersistentPracticeHistory() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(PRACTICE_ATTEMPTS_KEY);
    window.localStorage.removeItem(LATEST_PRACTICE_RESULT_KEY);
  } catch {
  }
}

function readPracticeAttempts() {
  const storage = getSessionStorage();

  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(PRACTICE_ATTEMPTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredPracticeAttempt) : [];
  } catch {
    return [];
  }
}

function sortPracticeAttempts(attempts: StoredPracticeAttempt[]) {
  return [...attempts].sort(
    (a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp)
  );
}

export function loadPracticeAttempts(): StoredPracticeAttempt[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    clearPersistentPracticeHistory();
    return sortPracticeAttempts(readPracticeAttempts()).slice(0, MAX_STORED_ATTEMPTS);
  } catch {
    return [];
  }
}
