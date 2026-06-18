import { QueryClient } from "@tanstack/react-query";

/**
 * Tạo QueryClient cho lớp server‑state (cache trong RAM, KHÔNG persist xuống
 * storage). Mỗi lần khởi tạo app gọi một lần (xem AppProviders) để cache ổn
 * định trong suốt phiên và an toàn SSR.
 *
 * - staleTime 30s: trong 30s coi dữ liệu là tươi → chuyển trang không refetch.
 * - gcTime 5 phút: cache còn trong RAM 5 phút sau khi không còn observer.
 * - refetchOnWindowFocus: tự revalidate khi người dùng quay lại tab.
 * - retry 1: thử lại 1 lần khi lỗi mạng tạm thời.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1
      }
    }
  });
}
