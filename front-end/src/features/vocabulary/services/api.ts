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
  note: string | null;
  audioUrl: string | null;
  reviewCount: number;
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
  note?: string;
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
    note: data.note ?? undefined,
    audioUrl: data.audioUrl ?? undefined,
    addedAt: data.createdAt,
    lastReviewedAt: data.lastReviewedAt ?? undefined,
    reviewCount: data.reviewCount
  };
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
