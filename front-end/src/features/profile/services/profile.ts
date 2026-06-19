import type { MockUser } from "@/features/auth";
import type { UserProfile } from "../types";
import { api } from "@/lib/api";
import { getUserInitials, normalizeAvatarUrl } from "@/lib/user-avatar";

export type ProfileResponse = {
  bannerTone?: string | null;
  bio?: string | null;
  updatedAt: string;
  userId: string;
  user: {
    avatarUrl?: string | null;
    displayName: string;
    email: string;
  };
};

let cachedProfile: { profile: UserProfile; userId: string } | null = null;
let pendingProfile: { promise: Promise<UserProfile>; userId: string } | null =
  null;

function normalizeBannerTone(value?: string | null): UserProfile["bannerTone"] {
  if (value === "sky" || value === "sunrise") {
    return value;
  }

  return "mint";
}

export function getDefaultUserProfile(user: MockUser): UserProfile {
  return {
    accountId: user.id,
    avatar: getUserInitials(user.displayName),
    avatarUrl: normalizeAvatarUrl(user.avatarUrl),
    bannerTone: "mint",
    bio: "",
    displayName: user.displayName,
    email: user.email,
    // Chưa tải được hồ sơ thật → để trống để UI hiển thị "Chưa cập nhật"
    // thay vì ngày hôm nay (gây hiểu nhầm là vừa cập nhật).
    updatedAt: "",
  };
}

function mapProfileResponse(data: ProfileResponse): UserProfile {
  return {
    accountId: data.userId,
    avatar: getUserInitials(data.user.displayName),
    avatarUrl: normalizeAvatarUrl(data.user.avatarUrl),
    bannerTone: normalizeBannerTone(data.bannerTone),
    bio: data.bio || "",
    displayName: data.user.displayName || "",
    email: data.user.email,
    updatedAt: data.updatedAt,
  };
}

export function cacheUserProfileResponse(data: ProfileResponse): UserProfile {
  const profile = mapProfileResponse(data);
  cachedProfile = { profile, userId: data.userId };
  return profile;
}

export function clearUserProfileCache() {
  cachedProfile = null;
  pendingProfile = null;
}

export async function loadUserProfile(user: MockUser): Promise<UserProfile> {
  if (cachedProfile?.userId === user.id) {
    return cachedProfile.profile;
  }

  if (pendingProfile?.userId === user.id) {
    return pendingProfile.promise;
  }

  const promise = api
    .get<ProfileResponse>("/profile")
    .then(cacheUserProfileResponse)
    .catch(() => {
      return getDefaultUserProfile(user);
    })
    .finally(() => {
      if (pendingProfile?.userId === user.id) {
        pendingProfile = null;
      }
    });

  pendingProfile = { promise, userId: user.id };
  return promise;
}

export async function saveUserProfile(
  profile: UserProfile,
): Promise<UserProfile> {
  const updateData = {
    bio: profile.bio.trim(),
    bannerTone: profile.bannerTone,
    displayName: profile.displayName.trim(),
  };

  const data = await api.patch<ProfileResponse>("/profile", updateData);

  return cacheUserProfileResponse(data);
}

export async function uploadUserAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.set("avatar", file);

  const data = await api.post<ProfileResponse>("/profile/avatar", formData);

  return cacheUserProfileResponse(data);
}
