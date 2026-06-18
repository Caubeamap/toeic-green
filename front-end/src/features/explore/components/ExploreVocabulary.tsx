"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
  RotateCcw,
  Search,
  Smile,
  ThumbsUp,
  Volume2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shuffle } from "@/lib/shuffle";
import { useUrlNumber, useUrlParam } from "@/lib/url-state";
import { useAuth } from "@/features/auth/hooks/auth";
import { POS_LABELS } from "@/features/vocabulary/types";
import { playAudio } from "@/features/vocabulary/services/storage";
import { loadExploreCollection, loadExploreCollections } from "../services/catalog";
import {
  fetchCollectionProgress,
  rateWord as rateWordApi,
  resetKnownRatings,
  setCollectionSaved
} from "../services/progress";
import type {
  ExploreCollection,
  ExploreCollectionSummary,
  ExploreProgress,
  ExploreWord,
  FlashcardRating
} from "../types";
import { setWordRating, toggleId } from "../services/storage";

type ExploreView = "collections" | "detail" | "review";
type LoadStatus = "idle" | "loading" | "ready" | "error";

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
  words: ExploreWord[],
  ratingsByWordId: Record<string, FlashcardRating>
) {
  if (words.length === 0) return 0;

  const ratedWords = words.filter((word) => ratingsByWordId[word.id]);
  return Math.round((ratedWords.length / words.length) * 100);
}

type ExploreVocabularyProps = {
  initialCollectionSlug?: string;
  initialView?: ExploreView;
};

function getCollectionRouteId(collection: ExploreCollectionSummary) {
  return collection.slug || collection.id;
}

function getCollectionHref(collection: ExploreCollectionSummary) {
  return `/explore/${encodeURIComponent(getCollectionRouteId(collection))}`;
}

function findCollectionByRouteId(
  collections: ExploreCollectionSummary[],
  routeId: string
) {
  return collections.find(
    (collection) => collection.id === routeId || collection.slug === routeId
  );
}

export function ExploreVocabulary({
  initialCollectionSlug,
  initialView
}: ExploreVocabularyProps = {}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const routeCollectionId = initialCollectionSlug?.trim() ?? "";
  const resolvedInitialView: ExploreView =
    initialView ?? (routeCollectionId ? "detail" : "collections");
  const [view, setView] = useState<ExploreView>(resolvedInitialView);
  const [query, setQuery] = useUrlParam("q", { replace: true });
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>("loading");
  const [collections, setCollections] = useState<ExploreCollectionSummary[]>([]);
  const [wordsByCollection, setWordsByCollection] = useState<
    Record<string, ExploreWord[]>
  >({});
  const [wordStatusByCollection, setWordStatusByCollection] = useState<
    Record<string, LoadStatus>
  >({});
  const [progressStatusByCollection, setProgressStatusByCollection] = useState<
    Record<string, LoadStatus>
  >({});
  const [progress, setProgress] = useState<ExploreProgress>(emptyProgress);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  // Deck flashcard ôn tập: đã loại từ "đã biết" và xáo trộn ngẫu nhiên mỗi lượt vào.
  const [reviewDeck, setReviewDeck] = useState<ExploreWord[]>([]);
  const [deckCollectionId, setDeckCollectionId] = useState<string | null>(null);
  const [isResettingKnown, setIsResettingKnown] = useState(false);

  // Ref để effect dựng deck đọc rating mới nhất mà không cần thêm vào deps.
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const buildReviewDeck = useCallback((words: ExploreWord[]) => {
    const ratings = progressRef.current.ratingsByWordId;
    return shuffle(words.filter((word) => ratings[word.id] !== "known"));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const loadedCollections = await loadExploreCollections();

        if (!mounted) return;

        const routeCollection = routeCollectionId
          ? findCollectionByRouteId(loadedCollections, routeCollectionId)
          : undefined;
        const initialCollectionId = routeCollectionId
          ? routeCollection?.id ?? routeCollectionId
          : loadedCollections[0]?.id ?? "";

        setCollections(loadedCollections);
        setSelectedCollectionId(initialCollectionId);
        setView(resolvedInitialView);
        setCatalogStatus("ready");
      } catch {
        if (!mounted) return;
        setSelectedCollectionId(routeCollectionId);
        setView(resolvedInitialView);
        setCatalogStatus("error");
      }
    }

    void loadInitialData();

    return () => {
      mounted = false;
    };
  }, [routeCollectionId, resolvedInitialView]);

  const selectedSummary = useMemo(() => {
    if (!selectedCollectionId) return collections[0];

    return findCollectionByRouteId(collections, selectedCollectionId);
  }, [collections, selectedCollectionId]);

  const selectedCollection = useMemo<ExploreCollection | undefined>(() => {
    if (!selectedSummary) return undefined;

    return {
      ...selectedSummary,
      words: wordsByCollection[selectedSummary.id] ?? []
    };
  }, [selectedSummary, wordsByCollection]);

  const ensureCollectionWords = useCallback(
    async (collectionId: string) => {
      const cachedWords = wordsByCollection[collectionId];
      if (cachedWords) return cachedWords;

      const summary = collections.find((collection) => collection.id === collectionId);
      if (!summary) return [];

      setWordStatusByCollection((current) => ({
        ...current,
        [collectionId]: "loading"
      }));

      try {
        const loadedCollection = await loadExploreCollection(summary);

        setWordsByCollection((current) => ({
          ...current,
          [collectionId]: loadedCollection.words
        }));
        setWordStatusByCollection((current) => ({
          ...current,
          [collectionId]: "ready"
        }));

        return loadedCollection.words;
      } catch {
        setWordStatusByCollection((current) => ({
          ...current,
          [collectionId]: "error"
        }));
        return [];
      }
    },
    [collections, wordsByCollection]
  );

  const ensureCollectionProgress = useCallback(
    async (summary: ExploreCollectionSummary) => {
      if (!isAuthenticated || progressStatusByCollection[summary.id]) {
        return;
      }

      setProgressStatusByCollection((current) => ({
        ...current,
        [summary.id]: "loading"
      }));

      try {
        const data = await fetchCollectionProgress(summary.slug);

        setProgress((current) => {
          const studying =
            data.isStudying && !current.studyingCollectionIds.includes(summary.id)
              ? [...current.studyingCollectionIds, summary.id]
              : current.studyingCollectionIds;
          const saved = data.isSaved
            ? current.savedCollectionIds.includes(summary.id)
              ? current.savedCollectionIds
              : [...current.savedCollectionIds, summary.id]
            : current.savedCollectionIds.filter((id) => id !== summary.id);

          return {
            ...current,
            ratingsByWordId: { ...current.ratingsByWordId, ...data.ratings },
            studyingCollectionIds: studying,
            savedCollectionIds: saved
          };
        });
        setProgressStatusByCollection((current) => ({
          ...current,
          [summary.id]: "ready"
        }));
      } catch {
        setProgressStatusByCollection((current) => ({
          ...current,
          [summary.id]: "error"
        }));
      }
    },
    [isAuthenticated, progressStatusByCollection]
  );

  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return collections.filter((collection) => {
      return (
        !normalizedQuery ||
        `${collection.title} ${collection.description} ${collection.category} ${collection.tags.join(
          " "
        )}`
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [collections, query]);

  const currentWords = selectedCollection?.words ?? [];
  const deckSize = reviewDeck.length;
  const currentWord =
    deckSize > 0 ? reviewDeck[currentWordIndex % deckSize] : undefined;
  const selectedProgress = getCollectionProgress(
    currentWords,
    progress.ratingsByWordId
  );
  const knownWords = currentWords.filter(
    (word) => progress.ratingsByWordId[word.id] === "known"
  ).length;
  // Đã học hết: bộ có từ, tất cả đều "đã biết" nên deck rỗng.
  const isReviewCompleted =
    currentWords.length > 0 && knownWords >= currentWords.length;
  const selectedWordStatus = selectedSummary
    ? wordStatusByCollection[selectedSummary.id] ?? "idle"
    : "idle";
  const isDetailView = view === "detail";
  const isCollectionRouteMissing =
    Boolean(routeCollectionId) &&
    catalogStatus === "ready" &&
    !selectedSummary;
  const selectedRouteId = selectedSummary
    ? getCollectionRouteId(selectedSummary)
    : "";
  const detailHref = selectedRouteId
    ? `/explore/${encodeURIComponent(selectedRouteId)}`
    : "/explore";
  const reviewHref = selectedRouteId ? `${detailHref}/review` : "/explore";

  useEffect(() => {
    if (
      (view !== "detail" && view !== "review") ||
      !selectedSummary ||
      selectedWordStatus !== "idle"
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void ensureCollectionWords(selectedSummary.id);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ensureCollectionWords, selectedSummary, selectedWordStatus, view]);

  // Tải tiến độ học (rating) từ DB khi mở chi tiết/review của user đã đăng nhập.
  useEffect(() => {
    if (
      (view !== "detail" && view !== "review") ||
      !selectedSummary ||
      !isAuthenticated
    ) {
      return;
    }

    const summary = selectedSummary;
    const timer = window.setTimeout(() => {
      void ensureCollectionProgress(summary);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ensureCollectionProgress, selectedSummary, view, isAuthenticated]);

  // Dựng deck ôn tập đúng 1 lần mỗi lượt vào review (sau khi đã có words + rating).
  useEffect(() => {
    if (view !== "review" || !selectedSummary) return;

    const id = selectedSummary.id;
    const wordsReady = wordStatusByCollection[id] === "ready";
    const progressState = progressStatusByCollection[id];
    // Lỗi tải tiến độ vẫn dựng deck (coi như chưa có rating) để không kẹt loading.
    const progressReady =
      !isAuthenticated ||
      progressState === "ready" ||
      progressState === "error";

    if (!wordsReady || !progressReady || deckCollectionId === id) return;

    const words = wordsByCollection[id] ?? [];
    const timer = window.setTimeout(() => {
      setReviewDeck(buildReviewDeck(words));
      setDeckCollectionId(id);
      setCurrentWordIndex(0);
      setShowAnswer(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    view,
    selectedSummary,
    wordStatusByCollection,
    progressStatusByCollection,
    isAuthenticated,
    wordsByCollection,
    deckCollectionId,
    buildReviewDeck
  ]);

  function prepareCollectionOpen(collectionId: string) {
    const collection = findCollectionByRouteId(collections, collectionId);
    const nextCollectionId = collection?.id ?? collectionId;

    setSelectedCollectionId(nextCollectionId);
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setProgress((current) => ({
      ...current,
      activeCollectionId: nextCollectionId
    }));

    if (collection) {
      void ensureCollectionWords(collection.id);
    }
  }

  function returnToCollections() {
    setView("collections");
    setCurrentWordIndex(0);
    setShowAnswer(false);
  }

  async function startReview(collectionId = selectedSummary?.id ?? "") {
    if (!collectionId) return;

    const words = await ensureCollectionWords(collectionId);
    if (words.length === 0) return;

    // Review là route riêng (.../review) nên sẽ remount và tự dựng deck mới
    // (xáo trộn ngẫu nhiên, loại từ "đã biết") qua effect dựng deck.
    if (reviewHref !== "/explore") {
      router.push(reviewHref);
    }
  }

  function closeReview() {
    setView("detail");
    setCurrentWordIndex(0);
    setShowAnswer(false);

    if (detailHref !== "/explore") {
      router.push(detailHref);
    }
  }

  function toggleSaved(collectionId: string) {
    const collection = findCollectionByRouteId(collections, collectionId);
    const slug = collection?.slug ?? collectionId;
    const willSave = !progress.savedCollectionIds.includes(collectionId);

    setProgress((current) => ({
      ...current,
      savedCollectionIds: toggleId(current.savedCollectionIds, collectionId),
      activeCollectionId: collectionId
    }));

    if (isAuthenticated) {
      void setCollectionSaved(slug, willSave).catch(() => {});
    }
  }

  function rateCurrentWord(rating: FlashcardRating) {
    if (!currentWord || !selectedCollection) return;

    const wordId = currentWord.id;

    setProgress((current) => ({
      ...current,
      ratingsByWordId: setWordRating(current.ratingsByWordId, wordId, rating),
      studyingCollectionIds: current.studyingCollectionIds.includes(
        selectedCollection.id
      )
        ? current.studyingCollectionIds
        : [...current.studyingCollectionIds, selectedCollection.id],
      activeCollectionId: selectedCollection.id
    }));

    // Trong 1 phiên, deck giữ nguyên: rating "known" chỉ ẩn ở lần vào sau.
    if (reviewDeck.length > 0) {
      setCurrentWordIndex((index) => (index + 1) % reviewDeck.length);
    }
    setShowAnswer(false);

    void rateWordApi(wordId, rating).catch(() => {});
  }

  function moveWord(direction: "previous" | "next") {
    if (reviewDeck.length === 0) return;

    setCurrentWordIndex((index) => {
      if (direction === "previous") {
        return index === 0 ? reviewDeck.length - 1 : index - 1;
      }

      return (index + 1) % reviewDeck.length;
    });
    setShowAnswer(false);
  }

  async function handleResetKnown() {
    if (!selectedSummary || isResettingKnown) return;

    const { id, slug } = selectedSummary;
    setIsResettingKnown(true);

    try {
      await resetKnownRatings(slug);

      setProgress((current) => {
        const ratings = { ...current.ratingsByWordId };
        for (const word of currentWords) {
          if (ratings[word.id] === "known") {
            delete ratings[word.id];
          }
        }
        return { ...current, ratingsByWordId: ratings };
      });

      // Đã bỏ hết "known" → dựng lại deck với toàn bộ từ, xáo trộn mới.
      setReviewDeck(shuffle(wordsByCollection[id] ?? currentWords));
      setDeckCollectionId(id);
      setCurrentWordIndex(0);
      setShowAnswer(false);
    } catch {
      // Giữ nguyên trạng thái nếu lỗi mạng/định danh.
    } finally {
      setIsResettingKnown(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20">
      <ExploreHeader compact={view !== "collections"} />

      <div className="container-shell pt-7">
        {view === "collections" ? (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
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

            {catalogStatus === "loading" ? <CollectionGridSkeleton /> : null}

            {catalogStatus === "error" ? (
              <EmptyState
                title="Chưa tải được dữ liệu flashcard"
                description="Kiểm tra lại thư mục dữ liệu tĩnh hoặc chạy lệnh đồng bộ từ flashcard-crawler."
              />
            ) : null}

            {catalogStatus === "ready" ? (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCollections.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      href={getCollectionHref(collection)}
                      isSaved={progress.savedCollectionIds.includes(collection.id)}
                      onOpen={() => prepareCollectionOpen(collection.id)}
                      onToggleSaved={() => toggleSaved(collection.id)}
                    />
                  ))}
                </div>

                {filteredCollections.length === 0 ? (
                  <EmptyState
                    title="Chưa có bộ từ phù hợp"
                    description="Thử tìm bằng tên bộ từ, kỹ năng hoặc kỳ thi khác."
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {isDetailView && catalogStatus === "loading" ? (
          <CollectionRouteMessage
            title="Đang tải bộ từ vựng"
            description="TOEIC Green đang chuẩn bị dữ liệu cho đường dẫn này."
            isLoading
          />
        ) : null}

        {isDetailView && catalogStatus === "error" ? (
          <CollectionRouteMessage
            title="Chưa tải được dữ liệu flashcard"
            description="Không thể tải danh sách bộ từ từ máy chủ. Hãy kiểm tra lại backend hoặc kết nối mạng."
            onBack={returnToCollections}
          />
        ) : null}

        {isDetailView && selectedCollection ? (
          <CollectionWordsPage
            key={selectedCollection.id}
            collection={selectedCollection}
            progressPercent={selectedProgress}
            isSaved={progress.savedCollectionIds.includes(selectedCollection.id)}
            isLoadingWords={
              selectedWordStatus === "idle" || selectedWordStatus === "loading"
            }
            hasLoadError={selectedWordStatus === "error"}
            onBack={returnToCollections}
            onStart={() => void startReview(selectedCollection.id)}
            onToggleSaved={() => toggleSaved(selectedCollection.id)}
          />
        ) : null}

        {isDetailView && isCollectionRouteMissing ? (
          <CollectionRouteMessage
            title="Không tìm thấy bộ từ vựng"
            description="Đường dẫn này không khớp với bộ từ nào đang được xuất bản."
            onBack={returnToCollections}
          />
        ) : null}

        {view === "review" && catalogStatus === "loading" ? (
          <CollectionRouteMessage
            title="Đang tải flashcards"
            description="TOEIC Green đang chuẩn bị dữ liệu luyện tập cho đường dẫn này."
            isLoading
          />
        ) : null}

        {view === "review" && catalogStatus === "error" ? (
          <CollectionRouteMessage
            title="Chưa tải được dữ liệu flashcard"
            description="Không thể tải danh sách bộ từ từ máy chủ. Hãy kiểm tra lại backend hoặc kết nối mạng."
            onBack={returnToCollections}
          />
        ) : null}

        {view === "review" && isCollectionRouteMissing ? (
          <CollectionRouteMessage
            title="Không tìm thấy bộ từ vựng"
            description="Đường dẫn này không khớp với bộ từ nào đang được xuất bản."
            onBack={returnToCollections}
          />
        ) : null}

        {view === "review" && selectedCollection ? (
          currentWord ? (
            <FlashcardReview
              collection={selectedCollection}
              currentWord={currentWord}
              currentWordIndex={currentWordIndex}
              deckSize={deckSize}
              knownWords={knownWords}
              progressPercent={selectedProgress}
              showAnswer={showAnswer}
              backHref={detailHref}
              isResettingKnown={isResettingKnown}
              onToggleAnswer={() => setShowAnswer((value) => !value)}
              onMoveWord={moveWord}
              onRate={rateCurrentWord}
              onResetKnown={handleResetKnown}
              onClose={closeReview}
            />
          ) : isReviewCompleted ? (
            <ReviewCompleted
              collection={selectedCollection}
              knownWords={knownWords}
              backHref={detailHref}
              isResettingKnown={isResettingKnown}
              onResetKnown={handleResetKnown}
              onClose={closeReview}
            />
          ) : (
            <ReviewLoading backHref={detailHref} onClose={closeReview} />
          )
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

function CollectionCard({
  collection,
  href,
  isSaved,
  onOpen,
  onToggleSaved
}: {
  collection: ExploreCollectionSummary;
  href: string;
  isSaved: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <article className="group flex min-h-[190px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
      <Link
        href={href}
        onClick={onOpen}
        prefetch={false}
        className="flex flex-1 flex-col text-left"
      >
        <div className="grid min-h-[36px] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="line-clamp-2 min-w-0 text-lg font-extrabold leading-6 text-ink">
            {collection.title}
          </h3>
          <span className="inline-flex min-h-8 shrink-0 items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">
            {collection.level}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={16} />
              {formatNumber(collection.wordCount)} từ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers size={16} />
              {collection.category}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-container text-[9px] font-black uppercase text-primary shadow-soft">
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
              "grid h-10 w-10 place-items-center rounded-lg border bg-white transition",
              isSaved
                ? "border-primary text-primary"
                : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
            )}
          >
            <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <Link
            href={href}
            onClick={onOpen}
            prefetch={false}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
          >
            Xem từ
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CollectionRouteMessage({
  title,
  description,
  isLoading = false,
  onBack
}: {
  title: string;
  description: string;
  isLoading?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-soft">
      {isLoading ? (
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      ) : (
        <Library className="mx-auto h-10 w-10 text-slate-300" />
      )}
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {onBack ? (
        <Link
          href="/explore"
          onClick={onBack}
          prefetch={false}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
        >
          <ArrowLeft size={16} />
          Quay lại Explore
        </Link>
      ) : null}
    </div>
  );
}

function CollectionWordsPage({
  collection,
  progressPercent,
  isSaved,
  isLoadingWords,
  hasLoadError,
  onBack,
  onStart,
  onToggleSaved
}: {
  collection: ExploreCollection;
  progressPercent: number;
  isSaved: boolean;
  isLoadingWords: boolean;
  hasLoadError: boolean;
  onBack: () => void;
  onStart: () => void;
  onToggleSaved: () => void;
}) {
  const listTopRef = useRef<HTMLDivElement | null>(null);

  const WORDS_PER_PAGE = 20;
  const hasWords = collection.words.length > 0;
  const isStartDisabled = isLoadingWords || hasLoadError || !hasWords;
  const totalWords = collection.words.length;
  const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE);

  // Trang hiện tại lấy từ URL (?page=) để bookmark/refresh/back-forward đều đúng.
  const [currentPage, setCurrentPage] = useUrlNumber("page", {
    defaultValue: 1,
    min: 1,
    max: Math.max(totalPages, 1)
  });

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * WORDS_PER_PAGE;
    const end = start + WORDS_PER_PAGE;
    return collection.words.slice(start, end);
  }, [collection.words, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Cuộn mượt về đầu danh sách sau khi đổi trang.
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalPages, currentPage + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/explore"
        onClick={onBack}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Quay lại Explore
      </Link>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="relative h-40 overflow-hidden bg-slate-900 md:h-48">
          {collection.coverImageUrl ? (
            <Image
              src={collection.coverImageUrl}
              alt={collection.title}
              fill
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/10" />
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
          <div ref={listTopRef} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-ink">
                Danh sách từ vựng
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Xem nhanh nghĩa và ví dụ trước khi bước vào chế độ flashcard.
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
                disabled={isStartDisabled}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoadingWords ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                Luyện tập flashcards
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
            {isLoadingWords ? <WordListSkeleton /> : null}

            {hasLoadError ? (
              <EmptyState
                title="Không tải được bộ từ"
                description="Dữ liệu chi tiết của bộ này chưa sẵn sàng. Hãy chạy lại lệnh đồng bộ flashcard."
              />
            ) : null}

            {!isLoadingWords && !hasLoadError && !hasWords ? (
              <EmptyState
                title="Bộ từ chưa có dữ liệu"
                description="Không tìm thấy từ hợp lệ trong file crawl tương ứng."
              />
            ) : null}

            {!isLoadingWords && !hasLoadError
              ? paginatedWords.map((word, index) => (
                  <WordListCard key={word.id} word={word} priority={index === 0} />
                ))
              : null}
          </div>

          {/* Pagination Controls */}
          {!isLoadingWords && !hasLoadError && totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-6">
              {currentPage > 1 ? (
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>
              ) : null}

              {getPageNumbers().map((pageNum) => {
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border text-sm font-bold transition px-3",
                      isActive
                        ? "bg-primary border-primary text-white hover:bg-primary/90 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function WordListCard({
  word,
  priority = false,
}: {
  word: ExploreWord;
  priority?: boolean;
}) {
  return (
    <article
      className={cn(
        "grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]",
        word.imageUrl && "md:grid-cols-[minmax(0,1fr)_180px] md:items-center"
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-extrabold text-ink">{word.word}</h3>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700">
            {POS_LABELS[word.partOfSpeech]}
          </span>
          {word.phonetic ? (
            <span className="text-sm font-bold text-muted">{word.phonetic}</span>
          ) : null}
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

        {word.example ? (
          <>
            <p className="mt-3 text-sm font-extrabold text-ink">Ví dụ:</p>
            <p className="mt-1 text-sm leading-6 text-muted">{word.example}</p>
          </>
        ) : null}

        {word.exampleTranslation ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {word.exampleTranslation}
          </p>
        ) : null}
      </div>

      {word.imageUrl ? (
        <Image
          src={word.imageUrl}
          alt={word.word}
          width={240}
          height={160}
          priority={priority}
          className="h-32 w-full rounded-lg object-cover md:h-28"
        />
      ) : null}
    </article>
  );
}

function FlashcardReview({
  collection,
  currentWord,
  currentWordIndex,
  deckSize,
  knownWords,
  progressPercent,
  showAnswer,
  backHref,
  isResettingKnown,
  onToggleAnswer,
  onMoveWord,
  onRate,
  onResetKnown,
  onClose
}: {
  collection: ExploreCollection;
  currentWord: ExploreWord;
  currentWordIndex: number;
  deckSize: number;
  knownWords: number;
  progressPercent: number;
  showAnswer: boolean;
  backHref: string;
  isResettingKnown: boolean;
  onToggleAnswer: () => void;
  onMoveWord: (direction: "previous" | "next") => void;
  onRate: (rating: FlashcardRating) => void;
  onResetKnown: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>

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
              {currentWordIndex + 1}/{deckSize} từ cần ôn · {knownWords} từ đã biết
            </p>
          </div>

          {knownWords > 0 ? (
            <button
              type="button"
              onClick={onResetKnown}
              disabled={isResettingKnown}
              className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              title="Đưa các từ đã biết trở lại danh sách ôn"
            >
              {isResettingKnown ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Ôn lại từ đã biết
            </button>
          ) : null}
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
                  ({POS_LABELS[currentWord.partOfSpeech]}) {currentWord.phonetic}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "grid w-full gap-6 text-left",
                  currentWord.imageUrl &&
                    "md:grid-cols-[minmax(0,1fr)_240px] md:items-center"
                )}
              >
                <div>
                  <h3 className="text-2xl font-extrabold text-ink">
                    {currentWord.word}
                  </h3>
                  <p className="mt-3 text-sm font-extrabold text-ink">
                    Định nghĩa:
                  </p>
                  <p className="mt-1 text-base leading-7 text-muted">
                    {currentWord.meaning}
                  </p>
                  {currentWord.example ? (
                    <>
                      <p className="mt-4 text-sm font-extrabold text-ink">
                        Ví dụ:
                      </p>
                      <p className="mt-1 text-base leading-7 text-muted">
                        {currentWord.example}
                      </p>
                    </>
                  ) : null}
                  {currentWord.exampleTranslation ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {currentWord.exampleTranslation}
                    </p>
                  ) : null}
                </div>
                {currentWord.imageUrl ? (
                  <Image
                    src={currentWord.imageUrl}
                    alt={currentWord.word}
                    width={320}
                    height={220}
                    className="h-44 w-full rounded-lg object-cover"
                  />
                ) : null}
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

function CollectionGridSkeleton() {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[232px] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
        >
          <div className="h-5 w-3/4 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-8 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-14 flex justify-between">
            <div className="h-8 w-24 rounded bg-slate-100" />
            <div className="h-10 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WordListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
        >
          <div className="h-5 w-44 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </>
  );
}

function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Library className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

function ReviewCompleted({
  collection,
  knownWords,
  backHref,
  isResettingKnown,
  onResetKnown,
  onClose
}: {
  collection: ExploreCollection;
  knownWords: number;
  backHref: string;
  isResettingKnown: boolean;
  onResetKnown: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-ink">
          Bạn đã học hết bộ này 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Toàn bộ {knownWords} từ của “{collection.title}” đã được đánh dấu “Đã
          biết”. Bạn có thể ôn lại từ đầu để củng cố trí nhớ.
        </p>

        <button
          type="button"
          onClick={onResetKnown}
          disabled={isResettingKnown}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isResettingKnown ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RotateCcw size={16} />
          )}
          Ôn lại từ đã biết
        </button>
      </div>
    </div>
  );
}

function ReviewLoading({
  backHref,
  onClose
}: {
  backHref: string;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm font-bold text-muted">
          Đang tải dữ liệu flashcard...
        </p>
      </div>
    </div>
  );
}
