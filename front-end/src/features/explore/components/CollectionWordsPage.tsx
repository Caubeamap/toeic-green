import Link from "next/link";
import { useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlState } from "@/lib/url-state";
import type { ExploreCollection, FlashcardRating } from "../types";
import {
  formatNumber,
  getWordStatus,
  WORD_FILTERS,
  type WordFilter
} from "../lib/explore-view";
import { WordListCard } from "./WordListCard";
import { EmptyState, WordListSkeleton } from "./ExploreStates";

export function CollectionWordsPage({
  collection,
  ratingsByWordId,
  progressPercent,
  isSaved,
  isLoadingWords,
  hasLoadError,
  onBack,
  onStart,
  onToggleSaved
}: {
  collection: ExploreCollection;
  ratingsByWordId: Record<string, FlashcardRating>;
  progressPercent: number;
  isSaved: boolean;
  isLoadingWords: boolean;
  hasLoadError: boolean;
  onBack: () => void;
  onStart: () => void;
  onToggleSaved: () => void;
}) {
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const { searchParams, setParams } = useUrlState();

  const WORDS_PER_PAGE = 20;
  const hasWords = collection.words.length > 0;
  const isStartDisabled = isLoadingWords || hasLoadError || !hasWords;

  // Số lượng từ theo từng trạng thái (tính trên toàn bộ list) — cho nhãn bộ lọc.
  const statusCounts = useMemo(() => {
    const counts: Record<WordFilter, number> = {
      all: collection.words.length,
      known: 0,
      learning: 0,
      new: 0
    };
    for (const word of collection.words) {
      counts[getWordStatus(ratingsByWordId[word.id])] += 1;
    }
    return counts;
  }, [collection.words, ratingsByWordId]);

  // Bộ lọc trạng thái lấy từ URL (?filter=) để bookmark/refresh đều đúng.
  const filterParam = searchParams.get("filter");
  const activeFilter: WordFilter = WORD_FILTERS.some(
    (item) => item.key === filterParam
  )
    ? (filterParam as WordFilter)
    : "all";

  const filteredWords = useMemo(() => {
    if (activeFilter === "all") return collection.words;
    return collection.words.filter(
      (word) => getWordStatus(ratingsByWordId[word.id]) === activeFilter
    );
  }, [collection.words, ratingsByWordId, activeFilter]);

  const totalPages = Math.max(Math.ceil(filteredWords.length / WORDS_PER_PAGE), 1);
  // Trang hiện tại lấy từ URL (?page=), kẹp [1, totalPages] cho an toàn.
  const currentPage = Math.min(
    Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, 1),
    totalPages
  );

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * WORDS_PER_PAGE;
    return filteredWords.slice(start, start + WORDS_PER_PAGE);
  }, [filteredWords, currentPage]);

  const scrollToListTop = () => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Đổi filter reset page về 1 (atomic) để không rơi vào trang trống.
  const handleFilterChange = (next: WordFilter) => {
    setParams({ filter: next === "all" ? null : next, page: null });
    scrollToListTop();
  };

  const handlePageChange = (page: number) => {
    setParams({ page: page <= 1 ? null : page });
    scrollToListTop();
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
        {/* Banner thương hiệu dùng chung cho MỌI list (không dùng ảnh cover
            riêng từng bộ để tránh ảnh sáng làm mất chữ). */}
        <div className="relative h-40 overflow-hidden md:h-48">
          {/* Nền gradient xanh TOEIC Green */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a8a2a] via-[#00731a] to-[#004d12]" />
          {/* Hoa văn lưới tinh tế */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
          {/* Vòng tròn trang trí */}
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="pointer-events-none absolute right-14 -bottom-16 h-44 w-44 rounded-full border border-white/10 bg-white/[0.04]" />
          {/* Icon motif bên phải (ẩn ở màn nhỏ) */}
          <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 text-white/15 md:block">
            <Layers size={118} strokeWidth={1.5} />
          </div>
          {/* Nội dung */}
          <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-5 md:px-8">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
              <BookOpen size={13} />
              {collection.category}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight text-white drop-shadow-sm md:text-3xl">
              Flashcards: {collection.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Danh sách gồm {formatNumber(collection.wordCount)} từ
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
                className="h-2 rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bộ lọc theo trạng thái học — để xem lại từ "Đã biết" / "Đang ôn". */}
          {!isLoadingWords && !hasLoadError && hasWords ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {WORD_FILTERS.map((item) => {
                const isActive = activeFilter === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleFilterChange(item.key)}
                    className={cn(
                      "inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold transition",
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        isActive ? "text-white/75" : "text-slate-400"
                      )}
                    >
                      {statusCounts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

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

            {!isLoadingWords &&
            !hasLoadError &&
            hasWords &&
            filteredWords.length === 0 ? (
              <EmptyState
                title="Chưa có từ nào ở mục này"
                description="Hãy chọn bộ lọc khác, hoặc luyện tập để chuyển từ sang trạng thái này."
              />
            ) : null}

            {!isLoadingWords && !hasLoadError
              ? paginatedWords.map((word, index) => (
                  <WordListCard
                    key={word.id}
                    word={word}
                    priority={index === 0}
                    status={getWordStatus(ratingsByWordId[word.id])}
                  />
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
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
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
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold transition px-3",
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
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
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
