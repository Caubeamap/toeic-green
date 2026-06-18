"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth";
import { makeQueryClient } from "@/lib/query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient ổn định theo vòng đời app; bọc ngoài AuthProvider để auth có thể
  // dùng useQueryClient() (clear cache khi logout, seed cache hồ sơ sau refresh).
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
