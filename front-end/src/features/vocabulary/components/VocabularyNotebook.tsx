"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, RotateCcw, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlState } from "@/lib/url-state";
import type { SortOption, StatusFilter } from "../types";
import { computeStats, filterWords, sortWords } from "../helpers";
import { useVocabulary } from "../hooks/useVocabulary";

import { VocabularyStats } from "./VocabularyStats";
import { VocabularyToolbar } from "./VocabularyToolbar";
import { VocabularyCard } from "./VocabularyCard";
import { VocabularyDetailDrawer } from "./VocabularyDetailDrawer";
import { AddVocabularyModal } from "./AddVocabularyModal";

const STATUS_FILTER_VALUES: StatusFilter[] = [
  "all",
  "learning",
  "mastered",
  "favorites"
];
const SORT_VALUES: SortOption[] = ["recent", "az"];

export function VocabularyNotebook() {
  // ── State ──────────────────────────────────────────────────────
  // Dữ liệu + CRUD do React Query quản lý (cache RAM, không localStorage).
  const {
    words,
    isLoading,
    toggleFavorite,
    toggleMastered,
    addWord,
    updateWord,
    deleteWord
  } = useVocabulary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Từ đang mở chi tiết suy ra từ cache → tự cập nhật khi CRUD thay đổi danh sách.
  const selectedWord = useMemo(
    () => words.find((w) => w.id === selectedId) ?? null,
    [words, selectedId]
  );

  // Tìm kiếm / lọc / sắp xếp lấy từ URL (?q=, ?status=, ?sort=) để bookmark & refresh giữ nguyên.
  const { searchParams, setParams } = useUrlState();
  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");
  const query = searchParams.get("q") ?? "";
  const statusFilter: StatusFilter = STATUS_FILTER_VALUES.includes(
    statusParam as StatusFilter
  )
    ? (statusParam as StatusFilter)
    : "all";
  const sort: SortOption = SORT_VALUES.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "recent";

  const setQuery = (value: string) =>
    setParams({ q: value || null }, { replace: true });
  const setStatusFilter = (value: StatusFilter) =>
    setParams({ status: value === "all" ? null : value });
  const setSort = (value: SortOption) =>
    setParams({ sort: value === "recent" ? null : value });

  // ── Derived data ───────────────────────────────────────────────
  const stats = useMemo(() => computeStats(words), [words]);
  const displayedWords = useMemo(
    () => sortWords(filterWords(words, query, statusFilter), sort),
    [words, query, statusFilter, sort]
  );

  const hasActiveFilters = !!query || statusFilter !== "all";

  const resetFilters = () => {
    // Xóa cả 3 param trong một lần điều hướng để tránh đẩy nhiều entry vào history.
    setParams({ q: null, status: null, sort: null });
  };

  return (
    <section className="min-h-screen bg-surface pb-20">
      <div className="container-shell pt-8">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-growth/15">
                <BookOpen size={18} className="text-growth-dark" />
              </span>
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
                Sổ tay từ vựng
              </h1>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Sổ tay cá nhân lưu trữ những từ vựng quan trọng cần ôn tập, giúp bạn theo dõi lộ trình thuộc từ mỗi ngày.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-growth-dark px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005d16]"
          >
            <Plus size={16} />
            Thêm từ mới
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="mt-6">
          <VocabularyStats {...stats} />
        </div>

        {/* ── Main content area ─────────────────────── */}
        <div className="mt-6 space-y-5">
          <VocabularyToolbar
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sort={sort}
            onSortChange={setSort}
          />

          {/* Word count */}
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-semibold text-zinc-400">
              {displayedWords.length} từ{hasActiveFilters && " phù hợp"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-academic-blue transition hover:text-growth-dark"
              >
                <RotateCcw size={12} />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Word list */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {Array.from({ length: 6 }).map((_, index) => (
                <VocabularyCardSkeleton key={index} />
              ))}
            </div>
          ) : displayedWords.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {displayedWords.map((w) => (
                <VocabularyCard
                  key={w.id}
                  word={w}
                  onToggleFavorite={toggleFavorite}
                  onToggleMastered={toggleMastered}
                  onViewDetail={(word) => setSelectedId(word.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              hasFilters={hasActiveFilters}
              onReset={resetFilters}
              onAddWord={() => setShowAddModal(true)}
            />
          )}
        </div>
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <VocabularyDetailDrawer
        word={selectedWord}
        onClose={() => setSelectedId(null)}
        onToggleFavorite={toggleFavorite}
        onToggleMastered={toggleMastered}
        onUpdate={updateWord}
        onDelete={deleteWord}
      />

      {/* ── Add Word Modal ─────────────────────────────────────────── */}
      <AddVocabularyModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addWord}
      />
    </section>
  );
}

/* ── Empty State ──────────────────────────────────────────────────── */

function EmptyState({
  hasFilters,
  onReset,
  onAddWord,
}: {
  hasFilters: boolean;
  onReset: () => void;
  onAddWord: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm">
        <SearchX size={24} className="text-zinc-300" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-ink">
        {hasFilters ? "Không có từ nào khớp bộ lọc" : "Chưa có từ nào được lưu"}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        {hasFilters
          ? "Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc để tìm từ bạn cần."
          : "Bắt đầu xây dựng sổ tay từ vựng bằng cách thêm các từ bạn gặp khi luyện đề TOEIC."}
      </p>
      <div className="mt-5 flex gap-2">
        {hasFilters && (
          <button
            onClick={onReset}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
          >
            Xóa bộ lọc
          </button>
        )}
        <button
          onClick={onAddWord}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition",
            "bg-growth-dark text-white hover:bg-[#005d16]"
          )}
        >
          <Plus size={14} />
          Thêm từ
        </button>
      </div>
    </div>
  );
}

function VocabularyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 rounded bg-slate-100" />
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded-lg bg-slate-100" />
          <div className="h-8 w-8 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-6 w-32 rounded bg-slate-100" />
        <div className="mt-2 h-4 w-40 rounded bg-slate-100" />
      </div>
      <div className="mt-3 h-5 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
    </div>
  );
}
