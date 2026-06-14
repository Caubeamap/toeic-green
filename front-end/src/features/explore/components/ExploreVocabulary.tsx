"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CopyCheck,
  Layers,
  Library,
  RotateCcw,
  Search,
  Smile,
  ThumbsUp,
  Users,
  Volume2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POS_LABELS } from "@/features/vocabulary/types";
import { playAudio } from "@/features/vocabulary/services/storage";
import { exploreCollections } from "../data";
import type {
  ExploreCollection,
  ExploreProgress,
  ExploreWord,
  FlashcardRating
} from "../types";
import {
  loadExploreProgress,
  saveExploreProgress,
  setWordRating,
  toggleId
} from "../services/storage";

type ExploreView = "collections" | "detail" | "review";

type CardPalette = {
  border: string;
  surface: string;
  badge: string;
};

const palettes: CardPalette[] = [
  {
    border: "border-emerald-200 hover:border-emerald-400",
    surface: "from-emerald-50 to-white",
    badge: "bg-emerald-50 text-emerald-700"
  },
  {
    border: "border-blue-200 hover:border-blue-400",
    surface: "from-blue-50 to-white",
    badge: "bg-blue-50 text-blue-700"
  },
  {
    border: "border-amber-200 hover:border-amber-400",
    surface: "from-amber-50 to-white",
    badge: "bg-amber-50 text-amber-700"
  },
  {
    border: "border-violet-200 hover:border-violet-400",
    surface: "from-violet-50 to-white",
    badge: "bg-violet-50 text-violet-700"
  },
  {
    border: "border-rose-200 hover:border-rose-400",
    surface: "from-rose-50 to-white",
    badge: "bg-rose-50 text-rose-700"
  },
  {
    border: "border-cyan-200 hover:border-cyan-400",
    surface: "from-cyan-50 to-white",
    badge: "bg-cyan-50 text-cyan-700"
  }
];

const ratingActions: {
  rating: FlashcardRating;
  label: string;
  icon: typeof Smile;
  className: string;
}[] = [
  {
    rating: "easy",
    label: "Dễ",
    icon: Smile,
    className: "text-emerald-700 hover:bg-emerald-50"
  },
  {
    rating: "medium",
    label: "Trung bình",
    icon: ThumbsUp,
    className: "text-amber-700 hover:bg-amber-50"
  },
  {
    rating: "hard",
    label: "Khó",
    icon: XCircle,
    className: "text-rose-700 hover:bg-rose-50"
  },
  {
    rating: "known",
    label: "Đã biết",
    icon: CheckCircle2,
    className: "text-blue-700 hover:bg-blue-50"
  }
];

const emptyProgress: ExploreProgress = {
  savedCollectionIds: [],
  studyingCollectionIds: [],
  ratingsByWordId: {}
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getCollectionProgress(
  collection: ExploreCollection,
  ratingsByWordId: Record<string, FlashcardRating>
) {
  const ratedWords = collection.words.filter((word) => ratingsByWordId[word.id]);
  return Math.round((ratedWords.length / collection.words.length) * 100);
}

function getPalette(index: number) {
  return palettes[index % palettes.length];
}

export function ExploreVocabulary() {
  const [view, setView] = useState<ExploreView>("collections");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<ExploreProgress>(emptyProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    exploreCollections[0]?.id ?? ""
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProgress = loadExploreProgress();
      setProgress(storedProgress);

      if (storedProgress.activeCollectionId) {
        setSelectedCollectionId(storedProgress.activeCollectionId);
      }

      setProgressLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (progressLoaded) {
      saveExploreProgress(progress);
    }
  }, [progress, progressLoaded]);

  const selectedCollection = useMemo(() => {
    return (
      exploreCollections.find((collection) => collection.id === selectedCollectionId) ??
      exploreCollections[0]
    );
  }, [selectedCollectionId]);

  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exploreCollections.filter((collection) => {
      return (
        !normalizedQuery ||
        `${collection.title} ${collection.description} ${collection.tags.join(" ")}`
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [query]);

  const currentWord =
    selectedCollection.words[currentWordIndex % selectedCollection.words.length];
  const selectedProgress = getCollectionProgress(
    selectedCollection,
    progress.ratingsByWordId
  );
  const knownWords = selectedCollection.words.filter(
    (word) => progress.ratingsByWordId[word.id] === "known"
  ).length;

  function openCollection(collectionId: string) {
    setSelectedCollectionId(collectionId);
    setView("detail");
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setProgress((current) => ({
      ...current,
      activeCollectionId: collectionId
    }));
  }

  function startReview(collectionId = selectedCollection.id) {
    setSelectedCollectionId(collectionId);
    setView("review");
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setProgress((current) => ({
      ...current,
      activeCollectionId: collectionId,
      studyingCollectionIds: current.studyingCollectionIds.includes(collectionId)
        ? current.studyingCollectionIds
        : [...current.studyingCollectionIds, collectionId]
    }));
  }

  function toggleSaved(collectionId: string) {
    setProgress((current) => ({
      ...current,
      savedCollectionIds: toggleId(current.savedCollectionIds, collectionId),
      activeCollectionId: collectionId
    }));
  }

  function rateCurrentWord(rating: FlashcardRating) {
    setProgress((current) => ({
      ...current,
      ratingsByWordId: setWordRating(
        current.ratingsByWordId,
        currentWord.id,
        rating
      ),
      studyingCollectionIds: current.studyingCollectionIds.includes(
        selectedCollection.id
      )
        ? current.studyingCollectionIds
        : [...current.studyingCollectionIds, selectedCollection.id],
      activeCollectionId: selectedCollection.id
    }));

    setCurrentWordIndex((index) => (index + 1) % selectedCollection.words.length);
    setShowAnswer(false);
  }

  function moveWord(direction: "previous" | "next") {
    setCurrentWordIndex((index) => {
      if (direction === "previous") {
        return index === 0 ? selectedCollection.words.length - 1 : index - 1;
      }

      return (index + 1) % selectedCollection.words.length;
    });
    setShowAnswer(false);
  }

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20">
      <ExploreHeader compact={view !== "collections"} />

      <div className="container-shell pt-7">
        {view === "collections" ? (
          <>
            <ExploreHero />

            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">
                  Khám phá bộ từ vựng
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Chọn một bộ để xem danh sách từ. Flashcard chỉ mở khi bạn bấm
                  luyện tập.
                </p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  placeholder="Tìm bộ từ..."
                  type="search"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCollections.map((collection, index) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  palette={getPalette(index)}
                  isSaved={progress.savedCollectionIds.includes(collection.id)}
                  onOpen={() => openCollection(collection.id)}
                  onToggleSaved={() => toggleSaved(collection.id)}
                />
              ))}
            </div>

            {filteredCollections.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <Library className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-lg font-extrabold text-ink">
                  Chưa có bộ từ phù hợp
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Thử tìm bằng tên bộ từ hoặc kỹ năng TOEIC khác.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {view === "detail" ? (
          <CollectionWordsPage
            collection={selectedCollection}
            progressPercent={selectedProgress}
            isSaved={progress.savedCollectionIds.includes(selectedCollection.id)}
            onBack={() => setView("collections")}
            onStart={() => startReview(selectedCollection.id)}
            onToggleSaved={() => toggleSaved(selectedCollection.id)}
          />
        ) : null}

        {view === "review" ? (
          <FlashcardReview
            collection={selectedCollection}
            currentWord={currentWord}
            currentWordIndex={currentWordIndex}
            knownWords={knownWords}
            progressPercent={selectedProgress}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer((value) => !value)}
            onMoveWord={moveWord}
            onRate={rateCurrentWord}
            onClose={() => setView("detail")}
          />
        ) : null}
      </div>
    </section>
  );
}

function ExploreHeader({ compact }: { compact: boolean }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div
        className={cn(
          "container-shell flex flex-col gap-3 py-8 md:flex-row md:items-end md:justify-between",
          compact && "py-6"
        )}
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-primary shadow-soft">
              <CopyCheck size={21} />
            </span>
            <h1 className="text-3xl font-extrabold text-ink md:text-4xl">
              Flashcards
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
            Học từ vựng TOEIC theo bộ, xem danh sách từ trước khi bắt đầu luyện.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExploreHero() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <Image
        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
        alt="Không gian học TOEIC"
        width={1400}
        height={260}
        priority
        className="h-44 w-full object-cover md:h-52"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/20 to-transparent" />
      <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-5 text-white md:px-8">
        <p className="text-sm font-bold uppercase">TOEIC Green Explore</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
          Chọn bộ từ, xem nghĩa, rồi luyện flashcard
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/82">
          Thiết kế tập trung vào việc học thật: ít bước, rõ nội dung, dễ quay
          lại bộ đang học.
        </p>
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  palette,
  isSaved,
  onOpen,
  onToggleSaved
}: {
  collection: ExploreCollection;
  palette: CardPalette;
  isSaved: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <article
      className={cn(
        "group flex min-h-[232px] flex-col overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-soft",
        palette.border,
        palette.surface
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col text-left"
      >
        <div className="grid min-h-[36px] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="line-clamp-2 min-w-0 text-lg font-extrabold leading-6 text-ink">
            {collection.title}
          </h3>
          <span
            className={cn(
              "inline-flex min-h-8 shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-extrabold",
              palette.badge
            )}
          >
            {collection.level}
          </span>
        </div>

        <div className="mt-0.5 space-y-2">
          <p className="line-clamp-2 text-sm leading-5 text-muted">
            {collection.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={16} />
              {formatNumber(collection.wordCount)} từ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} />
              {formatNumber(collection.learners)}
            </span>
          </div>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/70 pt-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d4f9d2] text-[9px] font-black text-primary shadow-soft">
            TG
          </span>
          <span className="text-sm font-extrabold leading-5 text-ink">
            TOEIC
            <br />
            Green
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleSaved}
            title={isSaved ? "Bỏ lưu" : "Lưu bộ từ"}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-lg border bg-white/90 transition",
              isSaved
                ? "border-primary text-primary"
                : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
            )}
          >
            <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
          >
            Xem từ
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CollectionWordsPage({
  collection,
  progressPercent,
  isSaved,
  onBack,
  onStart,
  onToggleSaved
}: {
  collection: ExploreCollection;
  progressPercent: number;
  isSaved: boolean;
  onBack: () => void;
  onStart: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Quay lại Explore
      </button>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="relative h-40 md:h-48">
          <Image
            src={collection.words[0]?.imageUrl}
            alt={collection.title}
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/35 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-5 text-white md:px-8">
            <p className="text-sm font-bold uppercase">{collection.category}</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">
              Flashcards: {collection.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/82">
              Danh sách gồm {formatNumber(collection.wordCount)} từ · khoảng{" "}
              {collection.estimatedMinutes} phút/lượt học.
            </p>
          </div>
        </div>

        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-ink">
                Danh sách từ vựng
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Xem nhanh nghĩa, ví dụ và hình minh họa trước khi bước vào chế
                độ flashcard.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onToggleSaved}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-lg border bg-white transition",
                  isSaved
                    ? "border-primary text-primary"
                    : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                )}
                title={isSaved ? "Bỏ lưu" : "Lưu bộ từ"}
              >
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={onStart}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
              >
                Luyện tập flashcards
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span>Tiến độ luyện</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {collection.words.map((word) => (
              <WordListCard key={word.id} word={word} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function WordListCard({ word }: { word: ExploreWord }) {
  return (
    <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-extrabold text-ink">{word.word}</h3>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-700">
            {POS_LABELS[word.partOfSpeech]}
          </span>
          <span className="text-sm font-bold text-muted">{word.phonetic}</span>
          <button
            type="button"
            onClick={() => playAudio(word.audioUrl)}
            disabled={!word.audioUrl}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full",
              word.audioUrl
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "bg-slate-100 text-slate-300"
            )}
            title="Nghe phát âm"
          >
            <Volume2 size={15} />
          </button>
        </div>

        <p className="mt-3 text-sm font-extrabold text-ink">Định nghĩa:</p>
        <p className="mt-1 text-sm leading-6 text-muted">{word.meaning}</p>

        <p className="mt-3 text-sm font-extrabold text-ink">Ví dụ:</p>
        <p className="mt-1 text-sm leading-6 text-muted">{word.example}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {word.exampleTranslation}
        </p>
      </div>

      <Image
        src={word.imageUrl}
        alt={word.word}
        width={240}
        height={160}
        className="h-32 w-full rounded-lg object-cover md:h-28"
      />
    </article>
  );
}

function FlashcardReview({
  collection,
  currentWord,
  currentWordIndex,
  knownWords,
  progressPercent,
  showAnswer,
  onToggleAnswer,
  onMoveWord,
  onRate,
  onClose
}: {
  collection: ExploreCollection;
  currentWord: ExploreWord;
  currentWordIndex: number;
  knownWords: number;
  progressPercent: number;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  onMoveWord: (direction: "previous" | "next") => void;
  onRate: (rating: FlashcardRating) => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={onClose}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-container text-primary">
                <Layers size={18} />
              </span>
              <h2 className="text-xl font-extrabold text-ink">
                Luyện tập: {collection.title}
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">
              {currentWordIndex + 1}/{collection.words.length} từ · {knownWords} từ đã biết
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-[#fbfcfd] p-4 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
              Từ mới
            </span>
            <button
              type="button"
              onClick={() => playAudio(currentWord.audioUrl)}
              disabled={!currentWord.audioUrl}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                currentWord.audioUrl
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-slate-100 text-slate-300"
              )}
              title="Nghe phát âm"
            >
              <Volume2 size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleAnswer}
            className="mt-5 grid min-h-[320px] w-full place-items-center rounded-xl bg-white px-5 text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]"
          >
            {!showAnswer ? (
              <div>
                <h3 className="text-3xl font-extrabold text-ink md:text-4xl">
                  {currentWord.word}
                </h3>
                <p className="mt-4 text-lg font-bold text-muted">
                  ({currentWord.partOfSpeech}) {currentWord.phonetic}
                </p>
              </div>
            ) : (
              <div className="grid w-full gap-6 text-left md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
                <div>
                  <h3 className="text-2xl font-extrabold text-ink">
                    {currentWord.word}
                  </h3>
                  <p className="mt-3 text-sm font-extrabold text-ink">Định nghĩa:</p>
                  <p className="mt-1 text-base leading-7 text-muted">
                    {currentWord.meaning}
                  </p>
                  <p className="mt-4 text-sm font-extrabold text-ink">Ví dụ:</p>
                  <p className="mt-1 text-base leading-7 text-muted">
                    {currentWord.example}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {currentWord.exampleTranslation}
                  </p>
                </div>
                <Image
                  src={currentWord.imageUrl}
                  alt={currentWord.word}
                  width={320}
                  height={220}
                  className="h-44 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </button>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onMoveWord("previous")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-muted transition hover:border-primary hover:text-primary"
              title="Từ trước"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              onClick={onToggleAnswer}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink transition hover:border-primary/35 hover:text-primary"
            >
              <RotateCcw size={16} />
              {showAnswer ? "Ẩn nghĩa" : "Xem nghĩa"}
            </button>
            <button
              type="button"
              onClick={() => onMoveWord("next")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-muted transition hover:border-primary hover:text-primary"
              title="Từ tiếp theo"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {ratingActions.map((action) => (
            <button
              key={action.rating}
              type="button"
              onClick={() => onRate(action.rating)}
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-extrabold transition",
                action.className
              )}
            >
              <action.icon size={18} />
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
