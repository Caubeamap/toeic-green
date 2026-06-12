/**
 * Dictionary lookup service.
 *
 * Currently calls the Free Dictionary API directly from the client.
 * When a backend is available, replace the fetch URL with your own
 * API route (e.g. `/api/dictionary/lookup?word=...`) — no other
 * changes needed in consuming components.
 */

import type { PartOfSpeech } from "../types";

// ── Response types from Free Dictionary API ──────────────────────

interface DictPhonetic {
  text?: string;
  audio?: string;
}

interface DictDefinition {
  definition: string;
  example?: string;
}

interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
}

interface DictEntry {
  word: string;
  phonetic?: string;
  phonetics: DictPhonetic[];
  meanings: DictMeaning[];
}

// ── Public result type ───────────────────────────────────────────

export type LookupResult = {
  phonetic: string;
  audioUrl: string;
  partOfSpeech: PartOfSpeech;
  example: string;
  /** English definition (for reference, not displayed to user) */
  definitionEn: string;
};

// ── Map API part-of-speech strings to our enum ───────────────────

const POS_MAP: Record<string, PartOfSpeech> = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
};

function mapPartOfSpeech(raw: string): PartOfSpeech {
  return POS_MAP[raw.toLowerCase()] ?? "phrase";
}

// ── Main lookup function ─────────────────────────────────────────

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function lookupWord(
  word: string
): Promise<LookupResult | null> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(trimmed)}`);
    if (!res.ok) return null;

    const data: DictEntry[] = await res.json();
    const entry = data[0];
    if (!entry) return null;

    // Phonetic text — prefer entry.phonetic, fallback to first non-empty
    const phonetic =
      entry.phonetic ||
      entry.phonetics.find((p) => p.text)?.text ||
      "";

    // Audio URL — prefer non-empty audio, favour US pronunciation
    const audioUrl =
      entry.phonetics.find((p) => p.audio && p.audio.includes("-us"))
        ?.audio ||
      entry.phonetics.find((p) => !!p.audio)?.audio ||
      "";

    // First meaning
    const firstMeaning = entry.meanings[0];
    const partOfSpeech = firstMeaning
      ? mapPartOfSpeech(firstMeaning.partOfSpeech)
      : "noun";

    // Find first available example sentence
    let example = "";
    let definitionEn = "";
    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions) {
        if (!definitionEn) definitionEn = def.definition;
        if (def.example && !example) {
          example = def.example;
        }
        if (example) break;
      }
      if (example) break;
    }

    return { phonetic, audioUrl, partOfSpeech, example, definitionEn };
  } catch {
    return null;
  }
}
