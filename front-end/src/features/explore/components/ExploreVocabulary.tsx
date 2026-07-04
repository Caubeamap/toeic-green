"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { shuffle } from "@/lib/shuffle";
import { useUrlParam } from "@/lib/url-state";
import { useAuth } from "@/features/auth/hooks/auth";
import {
  getNearbyReviewImageUrls,
  preloadReviewImages
} from "../lib/review-media";
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
import {
  emptyProgress,
  findCollectionByRouteId,
  getCollectionHref,
  getCollectionRouteId,
  summaryFromCollection,
  type ExploreView,
  type LoadStatus
} from "../lib/explore-view";
import { CollectionCard } from "./CollectionCard";
import { CollectionWordsPage } from "./CollectionWordsPage";
import { ExploreHeader } from "./ExploreHeader";
import {
  CollectionGridSkeleton,
  CollectionRouteMessage,
  EmptyState,
  ReviewCompleted,
  ReviewLoading
} from "./ExploreStates";
import { FlashcardReview } from "./FlashcardReview";

type ExploreVocabularyProps = {
  initialCollection?: ExploreCollection;
  initialCollections?: ExploreCollectionSummary[];
  initialCollectionSlug?: string;
  initialView?: ExploreView;
};

export function ExploreVocabulary({
  initialCollection,
  initialCollections,
  initialCollectionSlug,
  initialView
}: ExploreVocabularyProps = {}) {
  const router = useRouter();
  const { isAuthenticated, isApiReady } = useAuth();
  const routeCollectionId = initialCollectionSlug?.trim() ?? "";
  const resolvedInitialView: ExploreView =
    initialView ?? (routeCollectionId ? "detail" : "collections");
  const initialCollectionList =
    initialCollections ??
    (initialCollection ? [summaryFromCollection(initialCollection)] : []);
  const initialSelectedCollectionId =
    initialCollection?.id ?? routeCollectionId;
  const [view, setView] = useState<ExploreView>(resolvedInitialView);
  const [query, setQuery] = useUrlParam("q", { replace: true });
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>(
    initialCollectionList.length > 0 ? "ready" : "loading"
  );
  const [collections, setCollections] =
    useState<ExploreCollectionSummary[]>(initialCollectionList);
  const [wordsByCollection, setWordsByCollection] = useState<
    Record<string, ExploreWord[]>
  >(() =>
    initialCollection
      ? { [initialCollection.id]: initialCollection.words }
      : {}
  );
  const [wordStatusByCollection, setWordStatusByCollection] = useState<
    Record<string, LoadStatus>
  >(() => (initialCollection ? { [initialCollection.id]: "ready" } : {}));
  const [progressStatusByCollection, setProgressStatusByCollection] = useState<
    Record<string, LoadStatus>
  >({});
  const [progress, setProgress] = useState<ExploreProgress>(emptyProgress);
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    initialSelectedCollectionId
  );
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
      if (!isApiReady || progressStatusByCollection[summary.id]) {
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
    [isApiReady, progressStatusByCollection]
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

  useEffect(() => {
    if (view !== "review" || reviewDeck.length === 0) {
      return;
    }

    preloadReviewImages(
      getNearbyReviewImageUrls(reviewDeck, currentWordIndex, 2)
    );
  }, [currentWordIndex, reviewDeck, view]);
  // % tiến độ: dùng wordCount (có sẵn từ summary, tức thì) làm mẫu số thay vì
  // chờ tải hết danh sách từ nặng → thanh hiển thị nhanh ngay khi có rating.
  // Trên route chi tiết/review chỉ fetch progress của đúng bộ này nên số key
  // trong ratingsByWordId = số từ đã rating của bộ hiện tại.
  const selectedTotalWords = selectedSummary?.wordCount ?? currentWords.length;
  const selectedProgress =
    selectedTotalWords > 0
      ? Math.min(
          Math.round(
            (Object.keys(progress.ratingsByWordId).length / selectedTotalWords) *
              100
          ),
          100
        )
      : 0;
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
      !isApiReady
    ) {
      return;
    }

    const summary = selectedSummary;
    const timer = window.setTimeout(() => {
      void ensureCollectionProgress(summary);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ensureCollectionProgress, selectedSummary, view, isApiReady]);

  // Dựng deck ôn tập đúng 1 lần mỗi lượt vào review (sau khi đã có words + rating).
  useEffect(() => {
    if (view !== "review" || !selectedSummary) return;

    const id = selectedSummary.id;
    const wordsReady = wordStatusByCollection[id] === "ready";
    const progressState = progressStatusByCollection[id];
    // Lỗi tải tiến độ vẫn dựng deck (coi như chưa có rating) để không kẹt loading.
    const progressReady =
      !isAuthenticated ||
      (isApiReady && (progressState === "ready" || progressState === "error"));

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
    isApiReady,
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

    if (isApiReady) {
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

    if (isApiReady) {
      void rateWordApi(wordId, rating).catch(() => {});
    }
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
    if (!selectedSummary || !isApiReady || isResettingKnown) return;

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
    <section className="min-h-screen bg-surface pb-20">
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
              <div className="relative w-full lg:max-w-sm">
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
            ratingsByWordId={progress.ratingsByWordId}
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
