import {
  getPracticeStats,
  listRecentPracticeAttempts,
  type PracticeStats
} from "@/features/practice/services/practice-api";
import type { PracticeAttempt } from "@/features/practice/lib/practice-tests";
import {
  fetchVocabularyWords,
  readVocabularyCache,
  writeVocabularyCache
} from "@/features/vocabulary/services/api";
import type { VocabularyWord } from "@/features/vocabulary/types";

export type ProgressData = {
  stats: PracticeStats;
  attempts: PracticeAttempt[];
  words: VocabularyWord[];
};

export const emptyPracticeStats: PracticeStats = {
  totalAttempts: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  totalDurationSeconds: 0,
  averageAccuracy: null,
  bestAccuracy: null,
  bestScaledScore: null
};

/* ──────────────── Cache (stale-while-revalidate, theo user) ────────────────
 * Stats + lịch sử lượt luyện được cache theo userId để vào lại trang là thấy
 * ngay, rồi revalidate nền. Vocab dùng lại cache sẵn có của sổ từ vựng. Key có
 * tiền tố "toeic-green-" nên được dọn khi đăng xuất; gắn userId nên không rò rỉ
 * giữa các tài khoản.
 */
const PROGRESS_CACHE_KEY = "toeic-green-progress-cache";

type CachedPractice = { stats: PracticeStats; attempts: PracticeAttempt[] };

let memCache: { userId: string; data: CachedPractice } | null = null;

function readPracticeCache(userId: string): CachedPractice | null {
  if (memCache && memCache.userId === userId) return memCache.data;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROGRESS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      userId?: string;
      stats?: PracticeStats;
      attempts?: PracticeAttempt[];
    };
    if (
      parsed.userId !== userId ||
      !parsed.stats ||
      !Array.isArray(parsed.attempts)
    ) {
      return null;
    }
    const data = { stats: parsed.stats, attempts: parsed.attempts };
    memCache = { userId, data };
    return data;
  } catch {
    return null;
  }
}

function writePracticeCache(userId: string, data: CachedPractice): void {
  memCache = { userId, data };
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PROGRESS_CACHE_KEY,
      JSON.stringify({ userId, ...data })
    );
  } catch {
    // Storage đầy/không khả dụng — vẫn còn mem cache cho phiên hiện tại.
  }
}

/** Đọc dữ liệu đã cache (nếu có) để hiển thị tức thì trước khi gọi mạng. */
export function readCachedProgress(userId: string): ProgressData | null {
  const practice = readPracticeCache(userId);
  const words = readVocabularyCache(userId);
  if (!practice || words === null) return null;

  return { ...practice, words };
}

/** Tải dữ liệu tươi từ DB (3 nguồn song song) và cập nhật cache. */
export async function fetchProgress(userId: string): Promise<ProgressData> {
  const [stats, attempts, words] = await Promise.all([
    getPracticeStats(),
    listRecentPracticeAttempts(),
    fetchVocabularyWords()
  ]);

  writePracticeCache(userId, { stats, attempts });
  writeVocabularyCache(userId, words);

  return { stats, attempts, words };
}
