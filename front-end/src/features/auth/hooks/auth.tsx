"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  api,
  getErrorMessage,
  refreshSession,
  setAccessToken,
} from "@/lib/api";
import {
  cacheUserProfileResponse,
  clearUserProfileCache,
  type ProfileResponse,
} from "@/features/profile/services/profile";
import { getUserInitials, normalizeAvatarUrl } from "@/lib/user-avatar";
import type { AuthBootstrap } from "../services/auth-server";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type MockUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  avatar: string;
};

type AuthState =
  | { status: "loading"; user?: MockUser }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: MockUser };

type AuthContextValue = {
  state: AuthState;
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (
    updates: Partial<Pick<MockUser, "avatar" | "avatarUrl" | "displayName">>,
  ) => void;
};

type BackendUser = {
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  id: string;
  role: string;
};

type LoginResponse = {
  accessToken: string;
  user: BackendUser;
};

type RefreshResponse = {
  accessToken: string;
  profile?: ProfileResponse | null;
  user?: BackendUser;
};

/* ═══════════════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════════════ */

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(backendUser: BackendUser): MockUser {
  return {
    id: backendUser.id,
    email: backendUser.email,
    displayName: backendUser.displayName,
    avatarUrl: normalizeAvatarUrl(backendUser.avatarUrl),
    role: backendUser.role,
    avatar: getUserInitials(backendUser.displayName),
  };
}

export function AuthProvider({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth: AuthBootstrap | null;
}) {
  const [state, setState] = useState<AuthState>(() =>
    initialAuth?.user
      ? { status: "authenticated", user: mapUser(initialAuth.user) }
      : { status: "loading" },
  );
  const queryClient = useQueryClient();

  /* Khôi phục phiên khi mở web HOÀN TOÀN bằng refresh token (httpOnly cookie):
     `initialAuth` được render từ Server Component bằng cookie nên HTML đầu tiên
     đã có user/profile, không cần lưu token hay snapshot user trong Web Storage.
     Refresh vẫn chạy nền để mint access token RAM cho các API protected. */
  useEffect(() => {
    async function hydrate() {
      if (initialAuth?.profile) {
        cacheUserProfileResponse(initialAuth.profile);
      }

      try {
        const data = await refreshSession<RefreshResponse>();

        if (!data?.user || !data.profile) {
          throw new Error(
            "Refresh response is missing the current user profile",
          );
        }

        cacheUserProfileResponse(data.profile);
        setState({ status: "authenticated", user: mapUser(data.user) });
      } catch {
        // Không tìm thấy phiên hoặc refresh token đã hết hạn
        clearUserProfileCache();
        setState({ status: "unauthenticated" });
      }
    }

    hydrate();
  }, [initialAuth]);

  /* Lắng nghe sự kiện khi refresh token thất bại để tự động logout */
  useEffect(() => {
    function handleAuthFailure() {
      setAccessToken(null);
      clearUserProfileCache();
      queryClient.clear();
      setState({ status: "unauthenticated" });
    }

    window.addEventListener("toeic-auth-failed", handleAuthFailure);
    return () =>
      window.removeEventListener("toeic-auth-failed", handleAuthFailure);
  }, [queryClient]);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await api.post<LoginResponse>("/auth/login", {
          email,
          password,
        });
        const user = mapUser(data.user);
        setAccessToken(data.accessToken);
        setState({ status: "authenticated", user });
        return { ok: true };
      } catch (error: unknown) {
        return {
          ok: false,
          error: getErrorMessage(error, "Đăng nhập thất bại."),
        };
      }
    },
    [],
  );

  const register = useCallback(
    async (
      displayName: string,
      email: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        await api.post("/auth/register", { displayName, email, password });
        return { ok: true };
      } catch (error: unknown) {
        return {
          ok: false,
          error: getErrorMessage(error, "Đăng ký thất bại."),
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      // broadcast → các tab khác cũng đăng xuất theo (đồng bộ phiên chéo tab).
      setAccessToken(null, { broadcast: true });
      clearUserProfileCache();
      // Dữ liệu server nằm trong cache React Query (RAM) → xoá sạch để không lẫn
      // sang tài khoản khác trên cùng trình duyệt.
      queryClient.clear();
      setState({ status: "unauthenticated" });
    }
  }, [queryClient]);

  const updateUser = useCallback(
    (
      updates: Partial<Pick<MockUser, "avatar" | "avatarUrl" | "displayName">>,
    ) => {
      if (state.status !== "authenticated") {
        return;
      }

      const nextUser = {
        ...state.user,
        ...updates,
        avatar: updates.avatar || state.user.avatar,
        avatarUrl:
          updates.avatarUrl !== undefined
            ? updates.avatarUrl
            : state.user.avatarUrl,
        displayName: updates.displayName || state.user.displayName,
      };

      setState({ status: "authenticated", user: nextUser });
    },
    [state],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: "user" in state ? state.user ?? null : null,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
