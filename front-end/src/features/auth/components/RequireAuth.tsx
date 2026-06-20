"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../hooks/auth";

/**
 * Cổng đăng nhập cho các trang yêu cầu xác thực.
 * - Đang xác thực phiên → hiển thị spinner (tránh nháy nội dung).
 * - Chưa đăng nhập → chuyển hướng sang /login?next=<đường dẫn hiện tại>.
 * - Đã đăng nhập → render children.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isApiReady, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  if (isAuthenticated && isApiReady) {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f7f9]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
