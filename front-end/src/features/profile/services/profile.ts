import type { MockUser } from "@/features/auth";
import type { UserProfile } from "../types";

const PROFILE_STORAGE_PREFIX = "toeic-green-profile";

function getStorageKey(accountId: string) {
  return `${PROFILE_STORAGE_PREFIX}:${accountId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeAvatar(value: string) {
  const normalized = value.trim().slice(0, 3).toUpperCase();
  return normalized || "TG";
}

export function getDefaultUserProfile(user: MockUser): UserProfile {
  return {
    accountId: user.username,
    avatar: normalizeAvatar(user.avatar || user.displayName.slice(0, 2)),
    bannerTone: "mint",
    bio: "",
    displayName: user.displayName,
    email: "",
    updatedAt: new Date().toISOString(),
    username: user.username
  };
}

export function loadUserProfile(user: MockUser): UserProfile {
  const fallback = getDefaultUserProfile(user);

  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(user.username));

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>;

    return {
      ...fallback,
      ...parsed,
      accountId: user.username,
      avatar: normalizeAvatar(parsed.avatar ?? fallback.avatar),
      displayName: parsed.displayName?.trim() || fallback.displayName,
      username: parsed.username?.trim() || fallback.username
    };
  } catch (error) {
    console.error("Failed to load user profile", error);
    return fallback;
  }
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  const nextProfile = {
    ...profile,
    avatar: normalizeAvatar(profile.avatar),
    displayName: profile.displayName.trim(),
    updatedAt: new Date().toISOString(),
    username: profile.username.trim()
  };

  if (!canUseStorage()) {
    return nextProfile;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(nextProfile.accountId),
      JSON.stringify(nextProfile)
    );
  } catch (error) {
    console.error("Failed to save user profile", error);
  }

  return nextProfile;
}
