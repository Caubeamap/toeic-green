"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type UpdateOptions = {
  /**
   * `true` => router.replace (không thêm entry vào history) — dùng cho thao tác
   * gõ liên tục như ô tìm kiếm. `false` (mặc định) => router.push để nút
   * back/forward của trình duyệt hoạt động đúng với phân trang, tab, filter.
   */
  replace?: boolean;
  /** Có để Next tự cuộn lên đầu trang sau khi đổi URL hay không. Mặc định false. */
  scroll?: boolean;
  /**
   * `true` => cập nhật URL bằng native `window.history` (Next 14.1+/16 đồng bộ với
   * `useSearchParams`) thay vì `router.push/replace`. Tránh refetch RSC + reconcile
   * server tree → cập nhật state-điều-hướng tần suất cao (vd duyệt câu trong bài
   * review) gần như tức thì, không giật. Vẫn giữ URL bookmark được + back/forward.
   */
  native?: boolean;
};

type ParamUpdates = Record<string, string | number | null | undefined>;

/**
 * Đồng bộ state điều hướng (phân trang, tab, filter, search...) với query string
 * của URL. Đây là nguồn sự thật duy nhất cho các state mà người dùng cần
 * bookmark / chia sẻ / giữ nguyên khi refresh / dùng back-forward.
 *
 * Component dùng hook này phải nằm trong một `<Suspense>` boundary (yêu cầu của
 * Next.js App Router đối với `useSearchParams`).
 */
export function useUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  /** Cập nhật nhiều param cùng lúc (atomic) — giá trị rỗng/null sẽ xóa param. */
  const setParams = useCallback(
    (updates: ParamUpdates, options: UpdateOptions = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      const scroll = options.scroll ?? false;

      if (options.native && typeof window !== "undefined") {
        // Native history: không refetch RSC, useSearchParams vẫn đồng bộ (Next 16).
        if (options.replace) {
          window.history.replaceState(null, "", url);
        } else {
          window.history.pushState(null, "", url);
        }
        return;
      }

      if (options.replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [pathname, router, searchParams]
  );

  return { searchParams, setParams };
}

type StringParamOptions = UpdateOptions & {
  defaultValue?: string;
};

/**
 * Đọc/ghi một query param dạng chuỗi (tab, filter, sort, search).
 * Khi giá trị bằng `defaultValue` thì param được xóa để URL gọn gàng.
 */
export function useUrlParam(
  key: string,
  { defaultValue = "", replace = false, scroll = false }: StringParamOptions = {}
) {
  const { searchParams, setParams } = useUrlState();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setParams({ [key]: next === defaultValue ? null : next }, { replace, scroll });
    },
    [defaultValue, key, replace, scroll, setParams]
  );

  return [value, setValue] as const;
}

type NumberParamOptions = UpdateOptions & {
  defaultValue?: number;
  /** Chặn dưới (vd phân trang luôn >= 1). */
  min?: number;
  /** Chặn trên (vd <= totalPages). Bỏ qua nếu không truyền. */
  max?: number;
};

/**
 * Đọc/ghi một query param dạng số (phân trang, chỉ số câu hỏi...).
 * Tự kẹp [min, max] và xóa param khi bằng `defaultValue`.
 */
export function useUrlNumber(
  key: string,
  {
    defaultValue = 1,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    replace = false,
    scroll = false
  }: NumberParamOptions = {}
) {
  const { searchParams, setParams } = useUrlState();

  const parsed = Number.parseInt(searchParams.get(key) ?? "", 10);
  const safe = Number.isNaN(parsed) ? defaultValue : parsed;
  const value = Math.min(Math.max(safe, min), max);

  const setValue = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, min), max);
      setParams(
        { [key]: clamped === defaultValue ? null : clamped },
        { replace, scroll }
      );
    },
    [defaultValue, key, max, min, replace, scroll, setParams]
  );

  return [value, setValue] as const;
}
