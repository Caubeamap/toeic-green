type TestType = "Listening & Reading" | "Speaking & Writing";
type TestStatus = "New" | "Completed";
export type PracticeFilter = TestType | "Completed" | "Test History";

type TestPart = {
  id: string;
  label: string;
  description: string;
  questions: number;
};

export type PracticeAttempt = {
  id: string;
  testId?: string;
  testTitle?: string;
  attemptedAt: string;
  mode: "Practice" | "Full test";
  scopeLabels: string[];
  correct: number;
  total: number;
  durationSeconds: number;
  detailHref: string;
  scaledScore?: number;
  timestamp?: string;
};

export type PracticeTest = {
  id: string;
  title: string;
  subtitle: string;
  type: TestType;
  shortType: string;
  minutes: number;
  questions: number;
  access: string;
  status: TestStatus;
  attempts: number;
  parts: TestPart[];
  recentAttempts?: PracticeAttempt[];
  score?: string;
  completedAt?: string;
};

export const practiceFilters: PracticeFilter[] = [
  "Listening & Reading",
  "Speaking & Writing",
  "Completed",
  "Test History"
];

/**
 * Key sessionStorage giữ lựa chọn thời gian luyện tập theo từng đề. Đặt ở đây để
 * trang setup (ghi) và trang thi (đọc) dùng chung một chuỗi, không bị lệch.
 * Time là tùy chọn UI (số phút), cố tình KHÔNG để trên URL để người dùng không
 * sửa được giữa bài qua thanh địa chỉ.
 */
export function practiceTimeStorageKey(testId: string) {
  return `toeic-practice-time:${testId}`;
}

/**
 * Năm của đề nằm trong slug (`ets-2026-test-1`) chứ không phải một cột riêng
 * trong DB. Ưu tiên đọc từ slug vì đó là chuỗi do seed sinh ra, chỉ fallback
 * sang title khi slug không chứa năm. Đề không gắn năm (`practice-toeic-test-1`)
 * trả về null và chỉ xuất hiện ở lựa chọn "Tất cả".
 */
export function getPracticeTestYear(test: Pick<PracticeTest, "id" | "title">) {
  const slugYear = test.id.match(/(?:^|-)((?:19|20)\d{2})(?:-|$)/);
  if (slugYear) return slugYear[1];

  const titleYear = test.title.match(/\b(?:19|20)\d{2}\b/);
  return titleYear ? titleYear[0] : null;
}

/** Các năm có thật trong danh sách đề, sắp xếp giảm dần (mới nhất trước). */
export function collectPracticeTestYears(tests: PracticeTest[]) {
  const years = new Set<string>();

  for (const test of tests) {
    const year = getPracticeTestYear(test);
    if (year) years.add(year);
  }

  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

function normalizeTitlePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isGenericPracticeSubtitle(subtitle: string) {
  const normalized = normalizeTitlePart(subtitle);
  return (
    normalized === "toeic green practice" ||
    normalized === "toeic practice" ||
    normalized === "practice"
  );
}

export function formatPracticeTestTitle(
  test: Pick<PracticeTest, "title" | "subtitle">
) {
  const title = test.title.trim();
  const subtitle = test.subtitle.trim();

  if (!subtitle) return title;

  const normalizedTitle = normalizeTitlePart(title);
  const normalizedSubtitle = normalizeTitlePart(subtitle);

  if (
    normalizedTitle.includes(normalizedSubtitle) ||
    isGenericPracticeSubtitle(subtitle)
  ) {
    return title;
  }

  return `${title} ${subtitle}`;
}
