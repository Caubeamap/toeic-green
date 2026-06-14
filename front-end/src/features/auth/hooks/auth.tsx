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
import { api, getErrorMessage, setAccessToken } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type MockUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  // Kiểu tương thích với giao diện mock cũ
  username: string;
  avatar: string;
};

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: MockUser };

type AuthContextValue = {
  state: AuthState;
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (displayName: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<Pick<MockUser, "avatar" | "displayName" | "username">>) => void;
};

const STORAGE_KEY = "toeic-green-auth";

type BackendUser = {
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  id: string;
  role: string;
  username?: string | null;
};

type LoginResponse = {
  accessToken: string;
  user: BackendUser;
};

type ProfileResponse = {
  updatedAt: string;
  userId: string;
  username?: string | null;
  user: Omit<BackendUser, "id">;
};

type RefreshResponse = {
  accessToken: string;
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
    avatarUrl: backendUser.avatarUrl ?? undefined,
    role: backendUser.role,
    username: backendUser.username || backendUser.email.split("@")[0],
    avatar: backendUser.avatarUrl || backendUser.displayName?.trim().slice(0, 2).toUpperCase() || "TG",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  /* Tự động khôi phục phiên (Hydration) bằng Refresh Token khi mở trang web */
  useEffect(() => {
    async function hydrate() {
      try {
        // Thử refresh token ngầm
        const data = await api.post<RefreshResponse>("/auth/refresh");
        setAccessToken(data.accessToken);

        // Lấy thông tin cá nhân hiện tại
        const profileData = await api.get<ProfileResponse>("/profile");
        const user = {
          id: profileData.userId,
          email: profileData.user.email,
          displayName: profileData.user.displayName,
          avatarUrl: profileData.user.avatarUrl ?? undefined,
          role: profileData.user.role,
          username: profileData.username || profileData.user.email.split("@")[0],
          avatar: profileData.user.avatarUrl || profileData.user.displayName?.trim().slice(0, 2).toUpperCase() || "TG",
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        setState({ status: "authenticated", user });
      } catch {
        // Không tìm thấy phiên hoặc refresh token đã hết hạn
        localStorage.removeItem(STORAGE_KEY);
        setState({ status: "unauthenticated" });
      }
    }

    hydrate();
  }, []);

  /* Lắng nghe sự kiện khi refresh token thất bại để tự động logout */
  useEffect(() => {
    function handleAuthFailure() {
      setAccessToken(null);
      localStorage.removeItem(STORAGE_KEY);
      setState({ status: "unauthenticated" });
    }

    window.addEventListener("toeic-auth-failed", handleAuthFailure);
    return () => window.removeEventListener("toeic-auth-failed", handleAuthFailure);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await api.post<LoginResponse>("/auth/login", {
          email,
          password
        });
        const user = mapUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        setState({ status: "authenticated", user });
        return { ok: true };
      } catch (error: unknown) {
        return {
          ok: false,
          error: getErrorMessage(error, "Đăng nhập thất bại.")
        };
      }
    },
    []
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        await api.post("/auth/register", { displayName, email, password });
        return { ok: true };
      } catch (error: unknown) {
        return {
          ok: false,
          error: getErrorMessage(error, "Đăng ký thất bại.")
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setAccessToken(null);
      localStorage.removeItem(STORAGE_KEY);
      setState({ status: "unauthenticated" });
    }
  }, []);

  const updateUser = useCallback(
    (updates: Partial<Pick<MockUser, "avatar" | "displayName" | "username">>) => {
      if (state.status !== "authenticated") {
        return;
      }

      const nextUser = {
        ...state.user,
        ...updates,
        avatar: updates.avatar || state.user.avatar,
        displayName: updates.displayName || state.user.displayName,
        username: updates.username || state.user.username,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setState({ status: "authenticated", user: nextUser });
    },
    [state]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.status === "authenticated" ? state.user : null,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
