import type { ToeicQuestion } from "./toeic-questions";

function splitMediaUrls(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

function pushUnique(target: string[], seen: Set<string>, urls: string[]) {
  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      target.push(url);
    }
  }
}

export function getNearbyQuestionImageUrls(
  questions: ToeicQuestion[],
  currentIndex: number,
  lookAhead = 2,
) {
  if (questions.length === 0 || currentIndex < 0) {
    return [];
  }

  const start = Math.max(0, currentIndex - lookAhead);
  const end = Math.min(questions.length - 1, currentIndex + lookAhead);
  const urls: string[] = [];
  const seen = new Set<string>();

  for (let index = start; index <= end; index += 1) {
    pushUnique(urls, seen, splitMediaUrls(questions[index]?.image_url));
  }

  return urls;
}

export function getNextAudioUrls(
  audioUrls: string[],
  currentTrackIndex: number,
  lookAhead = 3,
) {
  if (audioUrls.length === 0 || currentTrackIndex < 0) {
    return [];
  }

  return audioUrls
    .slice(currentTrackIndex + 1, currentTrackIndex + 1 + lookAhead)
    .filter(Boolean);
}

export function preloadImageUrls(urls: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  for (const url of urls) {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
}
