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

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type MockUser = {
  username: string;
  displayName: string;
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
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<Pick<MockUser, "avatar" | "displayName">>) => void;
};

/* ═══════════════════════════════════════════════════════════════
   Mock credentials
   ═══════════════════════════════════════════════════════════════ */

const MOCK_ACCOUNTS: Record<string, { password: string; user: MockUser }> = {
  hoangusuk: {
    password: "123",
    user: {
      username: "hoangusuk",
      displayName: "Hoàng Usuk",
      avatar: "HU",
    },
  },
};

const STORAGE_KEY = "toeic-green-auth";

/* ═══════════════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════════════ */

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user: MockUser = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({ status: "authenticated", user });
      } else {
        setState({ status: "unauthenticated" });
      }
    } catch {
      setState({ status: "unauthenticated" });
    }
  }, []);

  const login = useCallback(
    (username: string, password: string): { ok: boolean; error?: string } => {
      const key = username.toLowerCase().trim();
      const account = MOCK_ACCOUNTS[key];

      if (!account) {
        return { ok: false, error: "Tài khoản không tồn tại." };
      }
      if (account.password !== password) {
        return { ok: false, error: "Mật khẩu không đúng." };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(account.user));
      setState({ status: "authenticated", user: account.user });
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ status: "unauthenticated" });
  }, []);

  const updateUser = useCallback(
    (updates: Partial<Pick<MockUser, "avatar" | "displayName">>) => {
      if (state.status !== "authenticated") {
        return;
      }

      const nextUser = {
        ...state.user,
        ...updates
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
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
