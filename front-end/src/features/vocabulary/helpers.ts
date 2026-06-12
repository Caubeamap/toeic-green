import type { SortOption, StatusFilter, VocabularyWord } from "./types";

export function filterWords(
  words: VocabularyWord[],
  query: string,
  statusFilter: StatusFilter
): VocabularyWord[] {
  const q = query.toLowerCase().trim();

  return words.filter((w) => {
    // Search across word, meaning, example, tags
    const matchesQuery =
      !q ||
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.example?.toLowerCase().includes(q) ||
      w.tags?.some((t) => t.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "favorites" ? w.isFavorite : w.status === statusFilter);

    return matchesQuery && matchesStatus;
  });
}

export function sortWords(
  words: VocabularyWord[],
  sort: SortOption
): VocabularyWord[] {
  const copy = [...words];

  switch (sort) {
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    case "az":
      return copy.sort((a, b) =>
        a.word.toLowerCase().localeCompare(b.word.toLowerCase())
      );
    default:
      return copy;
  }
}

export function computeStats(words: VocabularyWord[]) {
  return {
    total: words.length,
    mastered: words.filter((w) => w.status === "mastered").length,
    favorites: words.filter((w) => w.isFavorite).length,
  };
}
