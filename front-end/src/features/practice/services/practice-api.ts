import { api, getAccessToken } from "@/lib/api";
import type { SavedPracticeResult } from "../lib/practice-progress";
import type { PracticeAttempt, PracticeTest } from "../lib/practice-tests";
import type { ToeicQuestion } from "../lib/toeic-questions";

const TEST_CACHE_TTL_MS = 60_000;
const QUESTION_CACHE_TTL_MS = 10 * 60_000;

type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
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
    tests.forEach(setTestCache);
    testsWithProgressCache = {
      expiresAt: Date.now() + TEST_CACHE_TTL_MS,
      value: tests
    };
    return tests;
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

export async function submitPracticeAttempt(
  testId: string,
  input: SubmitPracticeAttemptInput
) {
  return api.post<PracticeAttemptResult>(
    `/practice/tests/${encodeURIComponent(testId)}/attempts`,
    input
  ).then((result) => {
    clearPracticeTestCaches();
    attemptResultCache.clear();

    // Lưu kết quả mới nộp vào localStorage để trang kết quả load tức thì
    if (typeof window !== "undefined" && result?.attempt?.id) {
      const cacheKey = `toeic-green-attempt-result:${result.attempt.id}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // Bỏ qua lỗi
      }
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
