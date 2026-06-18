import { api } from "@/lib/api";
import type { PartOfSpeech, VocabularyStatus, VocabularyWord } from "../types";

/** Hình dạng dữ liệu backend trả về (GET/POST/PATCH /vocabulary). */
type VocabularyApiWord = {
  id: string;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaning: string;
  example: string | null;
  exampleTranslation: string | null;
  status: VocabularyStatus;
  isFavorite: boolean;
  audioUrl: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
};

/** Payload gửi lên khi tạo/cập nhật (chỉ field backend cho phép — tránh bị whitelist chặn). */
export type VocabularyInput = {
  word: string;
  meaning: string;
  phonetic?: string;
  partOfSpeech?: PartOfSpeech;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  status?: VocabularyStatus;
  isFavorite?: boolean;
};

const VALID_POS: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase"
];

function toPartOfSpeech(value: string | null): PartOfSpeech {
  return VALID_POS.includes(value as PartOfSpeech)
    ? (value as PartOfSpeech)
    : "phrase";
}

function mapWord(data: VocabularyApiWord): VocabularyWord {
  return {
    id: data.id,
    word: data.word,
    phonetic: data.phonetic ?? "",
    partOfSpeech: toPartOfSpeech(data.partOfSpeech),
    meaning: data.meaning,
    example: data.example ?? "",
    exampleTranslation: data.exampleTranslation ?? "",
    tags: [],
    status: data.status === "mastered" ? "mastered" : "learning",
    isFavorite: data.isFavorite,
    audioUrl: data.audioUrl ?? undefined,
    addedAt: data.createdAt,
    lastReviewedAt: data.lastReviewedAt ?? undefined
  };
}

/* ──────────────── Cache (stale-while-revalidate, theo user) ────────────────
 * Hiển thị danh sách tức thì từ cache rồi revalidate nền → không bắt người dùng
 * chờ spinner ở các lần truy cập sau (kể cả refresh trang). Cache gắn theo userId
 * nên không rò rỉ dữ liệu giữa các tài khoản; key có tiền tố "toeic-green-" để
 * được dọn sạch khi đăng xuất.
 */
const VOCAB_CACHE_KEY = "toeic-green-vocabulary-cache";
let memCache: { userId: string; words: VocabularyWord[] } | null = null;

export function readVocabularyCache(userId: string): VocabularyWord[] | null {
  if (memCache && memCache.userId === userId) return memCache.words;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VOCAB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      userId?: string;
      words?: VocabularyWord[];
    };
    if (parsed.userId !== userId || !Array.isArray(parsed.words)) return null;
    memCache = { userId, words: parsed.words };
    return parsed.words;
  } catch {
    return null;
  }
}

export function writeVocabularyCache(
  userId: string,
  words: VocabularyWord[]
): void {
  memCache = { userId, words };
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      VOCAB_CACHE_KEY,
      JSON.stringify({ userId, words })
    );
  } catch {
    // Storage đầy/không khả dụng — bỏ qua, vẫn còn mem cache cho phiên hiện tại.
  }
}

export async function fetchVocabularyWords(): Promise<VocabularyWord[]> {
  const data = await api.get<VocabularyApiWord[]>("/vocabulary");
  return data.map(mapWord);
}

export async function createVocabularyWord(
  input: VocabularyInput
): Promise<VocabularyWord> {
  const data = await api.post<VocabularyApiWord>("/vocabulary", input);
  return mapWord(data);
}

export async function updateVocabularyWord(
  id: string,
  patch: Partial<VocabularyInput>
): Promise<VocabularyWord> {
  const data = await api.patch<VocabularyApiWord>(
    `/vocabulary/${encodeURIComponent(id)}`,
    patch
  );
  return mapWord(data);
}

export async function deleteVocabularyWord(id: string): Promise<void> {
  await api.delete(`/vocabulary/${encodeURIComponent(id)}`);
}
