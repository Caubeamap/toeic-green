/**
 * Vocabulary storage service.
 *
 * Currently persists to localStorage.
 */

import type { VocabularyWord } from "../types";
import { MOCK_VOCABULARY } from "../data";

const STORAGE_KEY = "toeic-green-vocabulary";

// ── Read ─────────────────────────────────────────────────────────

export function loadWords(): VocabularyWord[] {
  if (typeof window === "undefined") return MOCK_VOCABULARY;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return MOCK_VOCABULARY;
    const parsed = JSON.parse(raw) as VocabularyWord[];
    return parsed.length > 0 ? parsed : MOCK_VOCABULARY;
  } catch {
    return MOCK_VOCABULARY;
  }
}

// ── Write ────────────────────────────────────────────────────────

export function saveWords(words: VocabularyWord[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

// ── Audio playback helper ────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null;

export function playAudio(url: string | undefined): void {
  if (!url) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const audio = new Audio(url);
  currentAudio = audio;
  audio.play().catch(() => {
    // Playback failed (e.g. no user gesture, broken URL)
  });
}
