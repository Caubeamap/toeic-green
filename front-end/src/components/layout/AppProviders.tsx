"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import { makeQueryClient } from "@/lib/query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient ổn định theo vòng đời app; bọc ngoài AuthProvider để auth có thể
  // dùng useQueryClient() (clear cache khi logout, seed cache hồ sơ sau refresh).
  const [queryClient] = useState(makeQueryClient);

  // Dọn rác localStorage từ bản CŨ (trước khi chuyển server-state sang React Query):
  // các key `toeic-green-*` (auth/attempt-result/practice-tests/progress/vocabulary
  // cache...) không còn được ghi nhưng vẫn sót lại với user đã dùng bản cũ — vừa rác,
  // vừa là dữ liệu server keyed theo userId (rủi ro lẫn tài khoản trên máy dùng chung).
  // Access token sống ở sessionStorage nên KHÔNG bị ảnh hưởng. Chạy 1 lần, idempotent.
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
