"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Plus,
  Search
} from "lucide-react";
import Link from "next/link";
import {
  allPracticeTests,
  practiceFilters,
  type PracticeFilter,
  type PracticeTest
} from "@/lib/practice-tests";
import { cn } from "@/lib/utils";

export function PracticeSection() {
  const [activeFilter, setActiveFilter] = useState<PracticeFilter>("Listening & Reading");
  const [query, setQuery] = useState("");

  const historyTests = useMemo(
    () =>
      allPracticeTests
        .filter((test) => test.status === "Completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    []
  );

  const visibleTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseTests =
      activeFilter === "Test History"
        ? historyTests
        : activeFilter === "Completed"
          ? allPracticeTests.filter((test) => test.status === "Completed")
          : allPracticeTests.filter((test) => test.type === activeFilter);

    return baseTests.filter((test) => {
      return (
        !normalizedQuery ||
        `${test.title} ${test.subtitle} ${test.type}`.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, historyTests, query]);

  const isHistoryView = activeFilter === "Test History";
  const isCompletedView = activeFilter === "Completed";

  return (
    <section
      id="practice"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#f0fdf4_0%,#fbf9f8_46%),radial-gradient(circle_at_100%_100%,#eff6ff_0%,#fbf9f8_48%)] pb-20 pt-12"
    >
      <div className="container-shell">
        <div className="mb-12 max-w-2xl">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary transition group-focus-within:scale-110" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="glass-card w-full rounded-2xl px-12 py-4 text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Tìm kiếm đề thi (ví dụ: ETS 2024, TOEIC SW TEST 1)..."
              type="text"
            />
            <button
              className="absolute inset-y-2 right-3 rounded-xl bg-primary px-6 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
              type="button"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-headline-lg font-bold text-on-surface">
              {isHistoryView
                ? "Test History"
                : isCompletedView
                  ? "Completed Tests"
                  : "Practice Tests"}
            </h1>
            <p className="max-w-xl text-body-md text-on-surface-variant">
              {isHistoryView
                ? "Theo dõi các bài luyện thi đã bắt đầu hoặc đã hoàn thành để tiếp tục ôn tập đúng điểm yếu."
                : isCompletedView
                  ? "Danh sách các bài luyện thi đã hoàn thành, kèm điểm số và trạng thái review rõ ràng."
                  : "Sharpen your skills with our curated collection of full-length simulation tests designed to mirror the latest TOEIC standards."}
            </p>
          </div>

          <div className="glass-card grid w-full max-w-4xl grid-cols-1 gap-1 rounded-xl bg-surface-container-low p-1 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
            {practiceFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-5 py-2 text-label-md font-semibold text-on-surface-variant transition hover:bg-white/50 hover:text-on-surface",
                  activeFilter === filter && "bg-white font-bold text-primary shadow-sm"
                )}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {isHistoryView ? (
          <HistoryList tests={visibleTests} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTests.map((test) => (
              <PracticeTestCard key={test.id} test={test} />
            ))}
          </div>
        )}

        {!isHistoryView && !isCompletedView ? (
          <div className="mt-12 flex items-center justify-center gap-2">
            <PaginationButton label="Previous">
              <ChevronLeft className="h-5 w-5" />
            </PaginationButton>
            <PaginationButton active label="Page 1">
              1
            </PaginationButton>
            <PaginationButton label="Page 2">2</PaginationButton>
            <PaginationButton label="Page 3">3</PaginationButton>
            <span className="px-2 text-on-surface-variant">...</span>
            <PaginationButton label="Page 12">12</PaginationButton>
            <PaginationButton label="Next">
              <ChevronRight className="h-5 w-5" />
            </PaginationButton>
          </div>
        ) : null}
      </div>

      <button
        className="group fixed bottom-10 right-10 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-2xl transition hover:scale-110 active:scale-95"
        type="button"
      >
        <Plus className="h-8 w-8" />
        <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Start Custom Quiz
        </span>
      </button>
    </section>
  );
}

function PracticeTestCard({ test }: { test: PracticeTest }) {
  const completed = test.status === "Completed";
  const actionLabel = completed ? "Xem chi tiết" : "Bắt đầu làm";

  return (
    <article
      className={cn(
        "glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        completed && "border-primary/40 bg-primary-container/10"
      )}
    >
      <div className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
            {test.shortType}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              {test.access}
            </span>
            {completed ? (
              <span
                aria-label="Completed"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-soft"
                title="Completed"
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="mb-1 text-lg font-bold leading-tight text-on-surface">{test.title}</h3>
        <p className="mb-4 text-sm text-on-surface-variant">{test.subtitle}</p>

        <div className="mb-5 space-y-2 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Clock3 className="h-[18px] w-[18px]" />
            <span>{test.minutes} phút</span>
          </div>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-[18px] w-[18px]" />
            <span>{test.questions} câu hỏi</span>
          </div>
        </div>

        <Link
          href={`/practice/${test.id}/start`}
          className={cn(
            "mt-auto inline-flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-bold transition active:scale-[0.98]",
            completed && "border border-primary/30 bg-white/35 text-primary hover:bg-primary/10",
            !completed && "bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim"
          )}
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

function HistoryList({ tests }: { tests: PracticeTest[] }) {
  if (tests.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
        Chưa có bài luyện tập nào trong lịch sử.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => {
        const completed = test.status === "Completed";

        return (
          <article
            key={test.id}
            className={cn(
              "glass-card flex flex-col gap-4 rounded-2xl border border-white/50 p-5 shadow-soft md:flex-row md:items-center md:justify-between",
              completed && "border-primary/40 bg-primary-container/10"
            )}
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-on-surface">{test.title}</h3>
                  <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {test.shortType}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {test.subtitle} · {test.minutes} phút · {test.questions} câu hỏi
                </p>
                {completed && test.completedAt ? (
                  <p className="mt-1 text-xs font-semibold text-primary">
                    Hoàn thành ngày {test.completedAt}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href={`/practice/${test.id}/start`}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-bold transition active:scale-[0.98] md:w-36",
                completed
                  ? "border border-primary/30 bg-white/35 text-primary hover:bg-primary/10"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              Xem chi tiết
            </Link>
          </article>
        );
      })}
    </div>
  );
}

type PaginationButtonProps = {
  active?: boolean;
  children: ReactNode;
  label: string;
};

function PaginationButton({ active, children, label }: PaginationButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white",
        active && "border-primary bg-primary text-white hover:bg-primary"
      )}
      type="button"
    >
      {children}
    </button>
  );
}
