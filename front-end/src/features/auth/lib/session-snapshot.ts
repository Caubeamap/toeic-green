"use client";

import type { ProfileResponse } from "@/features/profile/services/profile";

const AUTH_SNAPSHOT_KEY = "toeic-green-session-auth";
const AUTH_SNAPSHOT_VERSION = 1;
const AUTH_SNAPSHOT_TTL_MS = 12 * 60 * 60_000;

export type AuthSessionUser = {
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  id: string;
  role: string;
};

type AuthSessionSnapshot = {
  version: typeof AUTH_SNAPSHOT_VERSION;
  savedAt: number;
  user: AuthSessionUser;
  profile?: ProfileResponse | null;
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

function isAuthSessionUser(value: unknown): value is AuthSessionUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Partial<AuthSessionUser>;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.displayName === "string" &&
    typeof user.role === "string"
  );
}

export function readAuthSessionSnapshot(): AuthSessionSnapshot | null {
  const storage = getSessionStorage();
  const raw = storage?.getItem(AUTH_SNAPSHOT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const snapshot = JSON.parse(raw) as Partial<AuthSessionSnapshot>;
    if (
      snapshot.version !== AUTH_SNAPSHOT_VERSION ||
      typeof snapshot.savedAt !== "number" ||
      Date.now() - snapshot.savedAt > AUTH_SNAPSHOT_TTL_MS ||
      !isAuthSessionUser(snapshot.user)
    ) {
      storage?.removeItem(AUTH_SNAPSHOT_KEY);
      return null;
    }

    return snapshot as AuthSessionSnapshot;
  } catch {
    storage?.removeItem(AUTH_SNAPSHOT_KEY);
    return null;
  }
}

export function writeAuthSessionSnapshot(
  user: AuthSessionUser,
  profile?: ProfileResponse | null,
) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const snapshot: AuthSessionSnapshot = {
    version: AUTH_SNAPSHOT_VERSION,
    savedAt: Date.now(),
    user,
    profile,
  };

  try {
    storage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Session snapshot is a UX hint only; auth still relies on refresh cookie.
  }
}

export function clearAuthSessionSnapshot() {
  getSessionStorage()?.removeItem(AUTH_SNAPSHOT_KEY);
}
