import type { MockUser } from "@/features/auth";
import type { UserProfile } from "../types";
import { api } from "@/lib/api";

function normalizeAvatar(value: string) {
  const normalized = value.trim().slice(0, 3).toUpperCase();
  return normalized || "TG";
}

export function getDefaultUserProfile(user: MockUser): UserProfile {
  return {
    accountId: user.id,
    avatar: normalizeAvatar(user.avatar || user.displayName.slice(0, 2)),
    bannerTone: "mint",
    bio: "",
    displayName: user.displayName,
    email: user.email,
    updatedAt: new Date().toISOString(),
    username: user.username,
  };
}

export async function loadUserProfile(user: MockUser): Promise<UserProfile> {
  try {
    const data = await api.get("/profile");
    return {
      accountId: data.userId,
      avatar: normalizeAvatar(data.user.avatarUrl || data.user.displayName?.slice(0, 2) || "TG"),
      bannerTone: data.bannerTone || "mint",
      bio: data.bio || "",
      displayName: data.user.displayName || "",
      email: data.user.email,
      updatedAt: data.updatedAt,
      username: data.username || "",
    };
  } catch (error) {
    console.error("Failed to load user profile from api, using default", error);
    return getDefaultUserProfile(user);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const updateData = {
    username: profile.username.trim(),
    bio: profile.bio.trim(),
    bannerTone: profile.bannerTone,
    displayName: profile.displayName.trim(),
    avatarUrl: profile.avatar,
  };

  const data = await api.patch("/profile", updateData);

  return {
    accountId: data.userId,
    avatar: normalizeAvatar(data.user.avatarUrl || data.user.displayName?.slice(0, 2) || "TG"),
    bannerTone: data.bannerTone || "mint",
    bio: data.bio || "",
    displayName: data.user.displayName || "",
    email: data.user.email,
    updatedAt: data.updatedAt,
    username: data.username || "",
  };
}
