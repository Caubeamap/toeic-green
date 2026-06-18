import type { PracticeTest } from "../lib/practice-tests";

/**
 * Fetch dữ liệu PUBLIC của Practice ở phía server (Server Component) để nhúng
 * thẳng vào HTML → first paint tức thì, không cần localStorage, không cần token.
 *
 * Chỉ import từ Server Component (page.tsx). Dùng ISR `revalidate: 60` để trang
 * gần như tĩnh, phục vụ tức thì và tự làm mới mỗi 60s. Lỗi (vd backend chưa sẵn
 * sàng lúc build) trả `undefined` → client tự fetch như thường (degrade an toàn).
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:2409/api";

const enc = encodeURIComponent;

export async function fetchPublicPracticeTests(): Promise<
  PracticeTest[] | undefined
> {
  try {
    const res = await fetch(`${API_URL}/practice/tests`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return undefined;
    return (await res.json()) as PracticeTest[];
  } catch {
    return undefined;
  }
}

export async function fetchPublicPracticeTest(
  slug: string
): Promise<PracticeTest | undefined> {
  try {
    const res = await fetch(`${API_URL}/practice/tests/${enc(slug)}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return undefined;
    return (await res.json()) as PracticeTest;
  } catch {
    return undefined;
  }
}
