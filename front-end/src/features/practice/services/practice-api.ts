import { api, getAccessToken } from "@/lib/api";
import type { SavedPracticeResult } from "../lib/practice-progress";
import type { PracticeAttempt, PracticeTest } from "../lib/practice-tests";
import type { ToeicQuestion } from "../lib/toeic-questions";

const TEST_CACHE_TTL_MS = 60_000;
const QUESTION_CACHE_TTL_MS = 10 * 60_000;
const AUTH_STORAGE_KEY = "toeic-green-auth";
const PRACTICE_TESTS_PUBLIC_STORAGE_KEY = "toeic-green-practice-tests:public";
const PRACTICE_TESTS_USER_STORAGE_PREFIX = "toeic-green-practice-tests:user:";
const PRACTICE_STATUS_USER_STORAGE_PREFIX = "toeic-green-practice-status:user:";
const MAX_LOCAL_STATUS_OVERRIDES = 20;

type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
};

type PracticeStatusOverride = {
  attempt: PracticeAttempt;
  cachedAt: number;
  testId: string;
};

let testsCache: CacheEntry<PracticeTest[]> | null = null;
let testsWithProgressCache: CacheEntry<PracticeTest[]> | null = null;
const testCache = new Map<string, CacheEntry<PracticeTest>>();
const testWithProgressCache = new Map<string, CacheEntry<PracticeTest>>();
const questionCache = new Map<string, CacheEntry<ToeicQuestion[]>>();
let progressCacheToken: string | null = null;

function hasFreshValue<T>(
  entry: CacheEntry<T> | null | undefined
): entry is CacheEntry<T> & { value: T } {
  return entry?.value !== undefined && entry.expiresAt > Date.now();
}

function setTestCache(test: PracticeTest) {
  testCache.set(test.id, {
    expiresAt: Date.now() + TEST_CACHE_TTL_MS,
    value: test
  });

  if (test.recentAttempts !== undefined) {
    testWithProgressCache.set(test.id, {
      expiresAt: Date.now() + TEST_CACHE_TTL_MS,
      value: test
    });
  }
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJsonFromStorage<T>(key: string): T | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJsonToStorage(key: string, value: unknown) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

function getStoredUserId() {
  const storedUser = readJsonFromStorage<{ id?: unknown }>(AUTH_STORAGE_KEY);
  return typeof storedUser?.id === "string" ? storedUser.id : null;
}

function getUserPracticeTestsStorageKey(userId: string) {
  return `${PRACTICE_TESTS_USER_STORAGE_PREFIX}${userId}`;
}

function getUserPracticeStatusStorageKey(userId: string) {
  return `${PRACTICE_STATUS_USER_STORAGE_PREFIX}${userId}`;
}

function isPracticeTestList(value: unknown): value is PracticeTest[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const test = item as Partial<PracticeTest>;
    return (
      typeof test.id === "string" &&
      typeof test.title === "string" &&
      typeof test.status === "string"
    );
  });
}

function readPracticeTestsStorage(userId = getStoredUserId()) {
  const keys = userId
    ? [getUserPracticeTestsStorageKey(userId), PRACTICE_TESTS_PUBLIC_STORAGE_KEY]
    : [PRACTICE_TESTS_PUBLIC_STORAGE_KEY];

  for (const key of keys) {
    const tests = readJsonFromStorage<unknown>(key);
    if (isPracticeTestList(tests) && tests.length > 0) {
      return tests;
    }
  }

  return null;
}

function readPracticeStatusOverrides(userId = getStoredUserId()) {
  if (!userId) {
    return new Map<string, PracticeStatusOverride>();
  }

  const stored = readJsonFromStorage<Record<string, PracticeStatusOverride>>(
    getUserPracticeStatusStorageKey(userId)
  );
  const overrides = new Map<string, PracticeStatusOverride>();

  if (!stored || typeof stored !== "object") {
    return overrides;
  }

  Object.values(stored).forEach((override) => {
    if (
      override &&
      typeof override.testId === "string" &&
      override.attempt &&
      typeof override.attempt.id === "string"
    ) {
      overrides.set(override.testId, override);
    }
  });

  return overrides;
}

function writePracticeStatusOverride(
  userId: string,
  override: PracticeStatusOverride
) {
  const overrides = readPracticeStatusOverrides(userId);
  overrides.set(override.testId, override);

  const compactEntries = Array.from(overrides.entries())
    .sort(([, a], [, b]) => b.cachedAt - a.cachedAt)
    .slice(0, MAX_LOCAL_STATUS_OVERRIDES);

  writeJsonToStorage(
    getUserPracticeStatusStorageKey(userId),
    Object.fromEntries(compactEntries)
  );
}

function getAttemptTimestamp(attempt: PracticeAttempt) {
  return attempt.timestamp ?? attempt.attemptedAt ?? "";
}

function mergeAttemptIntoTest(test: PracticeTest, attempt: PracticeAttempt): PracticeTest {
  const existingAttempts = test.recentAttempts ?? [];
  const alreadyHasAttempt = existingAttempts.some((item) => item.id === attempt.id);
  const recentAttempts = [attempt, ...existingAttempts.filter((item) => item.id !== attempt.id)]
    .sort((a, b) => getAttemptTimestamp(b).localeCompare(getAttemptTimestamp(a)))
    .slice(0, 5);
  const latestAttempt = recentAttempts[0] ?? attempt;

  return {
    ...test,
    status: "Completed",
    attempts: alreadyHasAttempt ? test.attempts : test.attempts + 1,
    recentAttempts,
    completedAt: latestAttempt.attemptedAt ?? test.completedAt
  };
}

export function mergePracticeTestsWithLocalStatus(
  tests: PracticeTest[],
  userId = getStoredUserId()
) {
  const overrides = readPracticeStatusOverrides(userId);
  if (overrides.size === 0) {
    return tests;
  }

  let changed = false;
  const mergedTests = tests.map((test) => {
    const override = overrides.get(test.id);
    if (!override) {
      return test;
    }

    changed = true;
    return mergeAttemptIntoTest(test, override.attempt);
  });

  return changed ? mergedTests : tests;
}

export function readCachedPracticeTestsForCurrentUser() {
  const userId = getStoredUserId();
  const cachedTests = readPracticeTestsStorage(userId);
  return cachedTests ? mergePracticeTestsWithLocalStatus(cachedTests, userId) : null;
}

export function cachePracticeTestsForCurrentUser(tests: PracticeTest[]) {
  const userId = getStoredUserId();
  const mergedTests = mergePracticeTestsWithLocalStatus(tests, userId);
  const cacheKey = userId
    ? getUserPracticeTestsStorageKey(userId)
    : PRACTICE_TESTS_PUBLIC_STORAGE_KEY;

  writeJsonToStorage(cacheKey, mergedTests);
  return mergedTests;
}

function buildSubmittedAttempt(result: PracticeAttemptResult): PracticeAttempt {
  const testId = result.attempt.testId ?? result.test.id;
  const timestamp = result.attempt.timestamp ?? result.result.timestamp;

  return {
    ...result.attempt,
    testId,
    testTitle: result.attempt.testTitle ?? result.result.testTitle,
    timestamp,
    detailHref:
      result.attempt.detailHref || `/practice/${testId}/results/${result.attempt.id}`
  };
}

function cacheSubmittedPracticeAttempt(result: PracticeAttemptResult) {
  const userId = getStoredUserId();
  if (!userId) {
    return;
  }

  const attempt = buildSubmittedAttempt(result);
  const override: PracticeStatusOverride = {
    attempt,
    cachedAt: Date.now(),
    testId: attempt.testId ?? result.test.id
  };

  writePracticeStatusOverride(userId, override);

  const baseTests =
    testsWithProgressCache?.value ??
    readPracticeTestsStorage(userId) ??
    testsCache?.value;
  if (!baseTests) {
    return;
  }

  const mergedTests = mergePracticeTestsWithLocalStatus(baseTests, userId);

  writeJsonToStorage(getUserPracticeTestsStorageKey(userId), mergedTests);
}

function syncProgressCacheToken() {
  const token = getAccessToken();

  if (progressCacheToken !== token) {
    progressCacheToken = token;
    testsWithProgressCache = null;
    testWithProgressCache.clear();
  }
}

function clearPracticeTestCaches() {
  testsCache = null;
  testsWithProgressCache = null;
  testCache.clear();
  testWithProgressCache.clear();
}

async function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttl: number,
  loader: () => Promise<T>
) {
  const current = cache.get(key);

  if (hasFreshValue(current)) {
    return current.value;
  }

  if (current?.promise) {
    return current.promise;
  }

  const promise = loader()
    .then((value) => {
      cache.set(key, {
        expiresAt: Date.now() + ttl,
        value
      });
      return value;
    })
    .catch((error) => {
      if (current?.value) {
        return current.value;
      }

      cache.delete(key);
      throw error;
    });

  cache.set(key, {
    expiresAt: Date.now() + ttl,
    promise,
    value: current?.value
  });

  return promise;
}

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
  if (hasFreshValue(testsCache)) {
    return testsCache.value;
  }

  if (testsCache?.promise) {
    return testsCache.promise;
  }

  const promise = api.get<PracticeTest[]>("/practice/tests").then((tests) => {
    tests.forEach(setTestCache);
    testsCache = {
      expiresAt: Date.now() + TEST_CACHE_TTL_MS,
      value: tests
    };
    return tests;
  });

  testsCache = {
    expiresAt: Date.now() + TEST_CACHE_TTL_MS,
    promise,
    value: testsCache?.value
  };

  return promise;
}

export async function listPracticeTestsWithProgress() {
  syncProgressCacheToken();

  if (hasFreshValue(testsWithProgressCache)) {
    return testsWithProgressCache.value;
  }

  if (testsWithProgressCache?.promise) {
    return testsWithProgressCache.promise;
  }

  const promise = api.get<PracticeTest[]>("/practice/tests/me").then((tests) => {
    const mergedTests = mergePracticeTestsWithLocalStatus(tests);
    mergedTests.forEach(setTestCache);
    testsWithProgressCache = {
      expiresAt: Date.now() + TEST_CACHE_TTL_MS,
      value: mergedTests
    };
    return mergedTests;
  });

  testsWithProgressCache = {
    expiresAt: Date.now() + TEST_CACHE_TTL_MS,
    promise,
    value: testsWithProgressCache?.value
  };

  return promise;
}

export async function getPracticeTest(testId: string) {
  return readCache(testCache, testId, TEST_CACHE_TTL_MS, () =>
    api.get<PracticeTest>(`/practice/tests/${encodeURIComponent(testId)}`)
  );
}

export async function getPracticeTestWithProgress(testId: string) {
  syncProgressCacheToken();

  return readCache(testWithProgressCache, testId, TEST_CACHE_TTL_MS, () =>
    api
      .get<PracticeTest>(
        `/practice/tests/${encodeURIComponent(testId)}/progress`
      )
      .then((test) => {
        setTestCache(test);
        return test;
      })
  );
}

export async function listPracticeQuestions(testId: string) {
  return readCache(questionCache, testId, QUESTION_CACHE_TTL_MS, () =>
    api.get<ToeicQuestion[]>(
      `/practice/tests/${encodeURIComponent(testId)}/questions`
    )
  );
}

export async function listRecentPracticeAttempts() {
  return api.get<PracticeAttempt[]>("/practice/attempts/recent");
}

export type PracticeStats = {
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  averageAccuracy: number | null;
  bestAccuracy: number | null;
  bestScaledScore: number | null;
};

export async function getPracticeStats() {
  return api.get<PracticeStats>("/practice/stats/me");
}

export async function submitPracticeAttempt(
  testId: string,
  input: SubmitPracticeAttemptInput
) {
  return api.post<PracticeAttemptResult>(
    `/practice/tests/${encodeURIComponent(testId)}/attempts`,
    input
  ).then((result) => {
    cacheSubmittedPracticeAttempt(result);
    clearPracticeTestCaches();
    attemptResultCache.clear();

    // Lưu kết quả mới nộp vào localStorage để trang kết quả load tức thì
    if (typeof window !== "undefined" && result?.attempt?.id) {
      const cacheKey = `toeic-green-attempt-result:${result.attempt.id}`;
      writeJsonToStorage(cacheKey, result);
    }

    return result;
  });
}

const ATTEMPT_RESULT_CACHE_TTL_MS = 60_000;
const attemptResultCache = new Map<string, CacheEntry<PracticeAttemptResult>>();

export async function getPracticeAttemptResult(testId: string, attemptId: string) {
  const key = `${testId}:${attemptId}`;
  return readCache(attemptResultCache, key, ATTEMPT_RESULT_CACHE_TTL_MS, () =>
    api.get<PracticeAttemptResult>(
      `/practice/tests/${encodeURIComponent(testId)}/attempts/${encodeURIComponent(attemptId)}`
    )
  );
}

export async function getLatestPracticeAttemptResult(testId: string) {
  const key = `${testId}:latest`;
  return readCache(attemptResultCache, key, ATTEMPT_RESULT_CACHE_TTL_MS, () =>
    api.get<PracticeAttemptResult>(
      `/practice/tests/${encodeURIComponent(testId)}/attempts/latest`
    )
  );
}
