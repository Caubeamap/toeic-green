/**
 * Vocabulary audio playback helper.
 *
 * Dữ liệu từ vựng cá nhân được lưu ở backend/DB (xem services/api.ts).
 * File này chỉ còn tiện ích phát âm thanh dùng chung cho UI từ vựng & flashcard.
 */

let currentAudio: HTMLAudioElement | null = null;

// Cache danh sách giọng đọc của trình duyệt. Trên iOS Safari getVoices() trả về
// rỗng ở lần gọi đầu (nạp bất đồng bộ) nên ta nạp sẵn lúc khởi tạo + lắng nghe
// 'voiceschanged' để có giọng tiếng Anh sẵn sàng khi người dùng bấm phát âm.
let voicesCache: SpeechSynthesisVoice[] = [];

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) voicesCache = voices;
  return voicesCache;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  // addEventListener thay vì gán onvoiceschanged để không đè handler khác.
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    refreshVoices();
  });
}

/**
 * Chọn giọng đọc tiếng Anh thật sự. iOS/Safari (máy đặt ngôn ngữ Tiếng Việt) nếu
 * chỉ set `utterance.lang = "en-US"` mà KHÔNG gán `utterance.voice` sẽ đọc văn bản
 * tiếng Anh bằng giọng mặc định của hệ thống (giọng Việt) → phát âm sai. Vì vậy
 * phải gán tường minh một giọng `en-*`.
 */
function pickEnglishVoice(preferLang = "en-US"): SpeechSynthesisVoice | undefined {
  const voices = refreshVoices();
  if (!voices.length) return undefined;
  const want = preferLang.toLowerCase();
  return (
    voices.find((v) => v.lang?.toLowerCase() === want) ??
    voices.find((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("en-us")) ??
    voices.find((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("en")) ??
    voices.find((v) => /english/i.test(v.name))
  );
}

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

    const voice = pickEnglishVoice(locale);
    if (voice) {
      // Gán giọng tiếng Anh tường minh: khắc phục iOS đọc bằng giọng Việt.
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Chưa nạp được danh sách giọng (hiếm) → vẫn ép lang tiếng Anh làm fallback.
      utterance.lang = /^en/i.test(locale) ? locale : "en-US";
    }
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
