"use client";

import type { PracticeTest } from "./practice-tests";

const PRACTICE_TESTS_SNAPSHOT_VERSION = 1;
const PRACTICE_TESTS_SNAPSHOT_TTL_MS = 5 * 60_000;

type PracticeTestsSnapshot = {
  version: typeof PRACTICE_TESTS_SNAPSHOT_VERSION;
  savedAt: number;
  tests: PracticeTest[];
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

function snapshotKey(userId: string) {
  return `toeic-green-session-practice-tests:${userId}`;
}

function isPracticeTestList(value: unknown): value is PracticeTest[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const test = item as Partial<PracticeTest>;
      return (
        typeof test.id === "string" &&
        typeof test.title === "string" &&
        (test.status === "New" || test.status === "Completed")
      );
    })
  );
}

export function readPracticeTestsSnapshot(userId: string): {
  savedAt: number;
  tests: PracticeTest[];
} | null {
  const storage = getSessionStorage();
  const raw = storage?.getItem(snapshotKey(userId));

  if (!raw) {
    return null;
  }

  try {
    const snapshot = JSON.parse(raw) as Partial<PracticeTestsSnapshot>;
    if (
      snapshot.version !== PRACTICE_TESTS_SNAPSHOT_VERSION ||
      typeof snapshot.savedAt !== "number" ||
      Date.now() - snapshot.savedAt > PRACTICE_TESTS_SNAPSHOT_TTL_MS ||
      !isPracticeTestList(snapshot.tests)
    ) {
      storage?.removeItem(snapshotKey(userId));
      return null;
    }

    return {
      savedAt: snapshot.savedAt,
      tests: snapshot.tests,
    };
  } catch {
    storage?.removeItem(snapshotKey(userId));
    return null;
  }
}

export function writePracticeTestsSnapshot(
  userId: string,
  tests: PracticeTest[],
) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const snapshot: PracticeTestsSnapshot = {
    version: PRACTICE_TESTS_SNAPSHOT_VERSION,
    savedAt: Date.now(),
    tests,
  };

  try {
    storage.setItem(snapshotKey(userId), JSON.stringify(snapshot));
  } catch {
    // Snapshot chỉ giúp render nhanh sau F5; query thật vẫn refetch khi cần.
  }
}

export function clearPracticeTestsSnapshots() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key?.startsWith("toeic-green-session-practice-tests:")) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Bỏ qua nếu trình duyệt chặn storage.
  }
}
