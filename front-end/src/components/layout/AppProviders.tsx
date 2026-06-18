"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import type { AuthBootstrap } from "@/features/auth/services/auth-server";
import { makeQueryClient } from "@/lib/query-client";
import { UserDataPrefetcher } from "./UserDataPrefetcher";

export function AppProviders({
  children,
  initialAuth
}: {
  children: ReactNode;
  initialAuth: AuthBootstrap | null;
}) {
  // QueryClient ổn định theo vòng đời app; bọc ngoài AuthProvider để auth có thể
  // dùng useQueryClient() (clear cache khi logout, seed cache hồ sơ sau refresh).
  const [queryClient] = useState(makeQueryClient);

  // Dọn rác storage từ các bản CŨ (trước khi chuyển server-state sang React Query
  // và auth bootstrap bằng httpOnly cookie). Access token hiện chỉ sống trong RAM.
  // các key `toeic-green-*` (auth/attempt-result/practice-tests/progress/vocabulary
  // cache...) không còn được ghi nhưng vẫn sót lại với user đã dùng bản cũ — vừa rác,
  // vừa là dữ liệu server keyed theo userId (rủi ro lẫn tài khoản trên máy dùng chung).
  useEffect(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith("toeic-green-")) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // localStorage có thể không truy cập được (chế độ riêng tư) → bỏ qua.
    }

    try {
      sessionStorage.removeItem("toeic-green-access-token");
      sessionStorage.removeItem("toeic-green-session-auth");
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("toeic-green-session-practice-tests:")) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      // sessionStorage có thể không truy cập được (chế độ riêng tư) → bỏ qua.
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialAuth={initialAuth}>
        <UserDataPrefetcher />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
