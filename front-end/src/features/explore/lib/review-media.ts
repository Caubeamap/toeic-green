import type { ExploreWord } from "../types";

function pushImageUrl(target: string[], seen: Set<string>, word?: ExploreWord) {
  const url = word?.imageUrl?.trim();
  if (url && !seen.has(url)) {
    seen.add(url);
    target.push(url);
  }
}

export function getNearbyReviewImageUrls(
  deck: ExploreWord[],
  currentIndex: number,
  lookAround = 2,
) {
  if (deck.length === 0 || currentIndex < 0) {
    return [];
  }

  const urls: string[] = [];
  const seen = new Set<string>();
  const start = Math.max(0, currentIndex - lookAround);
  const end = Math.min(deck.length - 1, currentIndex + lookAround);

  for (let index = start; index <= end; index += 1) {
    pushImageUrl(urls, seen, deck[index]);
  }

  return urls;
}

export function preloadReviewImages(urls: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  for (const url of urls) {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
}
