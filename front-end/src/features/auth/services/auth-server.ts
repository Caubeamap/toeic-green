import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

type BootstrapUser = {
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  id: string;
  role: string;
};

type BootstrapProfile = {
  bio: string | null;
  bannerTone: string;
  updatedAt: string;
  userId: string;
  user: {
    avatarUrl?: string | null;
    displayName: string;
    email: string;
    role: string;
  };
};

export type AuthBootstrap = {
  profile?: BootstrapProfile | null;
  user: BootstrapUser;
};

export async function fetchAuthBootstrap(): Promise<AuthBootstrap | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/bootstrap`, {
      cache: "no-store",
      headers: {
        Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`
      }
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthBootstrap;
  } catch {
    return null;
  }
}
