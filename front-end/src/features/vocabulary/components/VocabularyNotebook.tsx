"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, RotateCcw, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlState } from "@/lib/url-state";
import type { SortOption, StatusFilter, VocabularyWord } from "../types";
import { computeStats, filterWords, sortWords } from "../helpers";
import { loadWords, saveWords } from "../services/storage";

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
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  // Load words from storage on client mount
  useEffect(() => {
    const loaded = loadWords();
    const timer = setTimeout(() => {
      setWords(loaded);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save words to storage whenever they change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveWords(words);
    }
  }, [words, isLoaded]);

  // ── Derived data ───────────────────────────────────────────────
  const stats = useMemo(() => computeStats(words), [words]);
  const displayedWords = useMemo(
    () => sortWords(filterWords(words, query, statusFilter), sort),
    [words, query, statusFilter, sort]
  );

  const hasActiveFilters = !!query || statusFilter !== "all";

  // ── Handlers ───────────────────────────────────────────────────
  const toggleFavorite = useCallback((id: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w))
    );
    // Also update selectedWord if it's open
    setSelectedWord((sw) =>
      sw?.id === id ? { ...sw, isFavorite: !sw.isFavorite } : sw
    );
  }, []);

  const toggleMastered = useCallback((id: string) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: w.status === "mastered" ? "learning" : "mastered",
              lastReviewedAt: new Date().toISOString(),
            }
          : w
      )
    );
    setSelectedWord((sw) =>
      sw?.id === id
        ? {
            ...sw,
            status: sw.status === "mastered" ? "learning" : "mastered",
            lastReviewedAt: new Date().toISOString(),
          }
        : sw
    );
  }, []);

  const addWord = useCallback((word: VocabularyWord) => {
    setWords((prev) => [word, ...prev]);
  }, []);

  const updateWord = useCallback((updatedWord: VocabularyWord) => {
    setWords((prev) =>
      prev.map((w) => (w.id === updatedWord.id ? updatedWord : w))
    );
    setSelectedWord((sw) => (sw?.id === updatedWord.id ? updatedWord : sw));
  }, []);

  const resetFilters = useCallback(() => {
    // Xóa cả 3 param trong một lần điều hướng để tránh đẩy nhiều entry vào history.
    setParams({ q: null, status: null, sort: null });
  }, [setParams]);

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
                Vocabulary Notes
              </h1>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Sổ tay từ vựng TOEIC cá nhân — lưu, tra cứu, ôn tập và theo dõi
              trạng thái ghi nhớ từng từ.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-growth-dark px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005d16]"
          >
            <Plus size={16} />
            Add New Word
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
              {displayedWords.length} word
              {displayedWords.length !== 1 && "s"}
              {hasActiveFilters && " found"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-academic-blue transition hover:text-growth-dark"
              >
                <RotateCcw size={12} />
                Reset filters
              </button>
            )}
          </div>

          {/* Word list */}
          {displayedWords.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {displayedWords.map((w) => (
                <VocabularyCard
                  key={w.id}
                  word={w}
                  onToggleFavorite={toggleFavorite}
                  onToggleMastered={toggleMastered}
                  onViewDetail={setSelectedWord}
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
        onClose={() => setSelectedWord(null)}
        onToggleFavorite={toggleFavorite}
        onToggleMastered={toggleMastered}
        onUpdate={updateWord}
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
        {hasFilters ? "No words match your filters" : "No words saved yet"}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Start building your vocabulary notebook by adding words from TOEIC practice tests."}
      </p>
      <div className="mt-5 flex gap-2">
        {hasFilters && (
          <button
            onClick={onReset}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
          >
            Reset Filters
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
          Add Word
        </button>
      </div>
    </div>
  );
}
