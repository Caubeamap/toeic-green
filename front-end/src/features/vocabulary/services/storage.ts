/**
 * Vocabulary audio playback helper.
 *
 * Dữ liệu từ vựng cá nhân được lưu ở backend/DB (xem services/api.ts).
 * File này chỉ còn tiện ích phát âm thanh dùng chung cho UI từ vựng & flashcard.
 */

let currentAudio: HTMLAudioElement | null = null;

export function playAudio(url: string | undefined): void {
  if (!url) return;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (url.startsWith("tts://")) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const [, locale = "en-US", rawText = ""] =
      url.match(/^tts:\/\/([^/]+)\/(.+)$/) ?? [];
    const text = decodeURIComponent(rawText);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.92;

    window.speechSynthesis.speak(utterance);
    return;
  }

  const audio = new Audio(url);
  currentAudio = audio;
  audio.play().catch(() => {
    // Playback failed (e.g. no user gesture, broken URL)
  });
}
