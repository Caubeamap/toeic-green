"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Search
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { practiceFilters, type PracticeAttempt, type PracticeFilter, type PracticeTest } from "../lib/practice-tests";
import { listPracticeTests, listRecentPracticeAttempts } from "../services/practice-api";

function getLatestAttemptTimestamp(test: PracticeTest) {
  const [latestAttempt] = test.recentAttempts ?? [];

  return latestAttempt?.timestamp ?? test.completedAt ?? "";
}

function mergeAttempts(tests: PracticeTest[], attempts: PracticeAttempt[]) {
  if (attempts.length === 0) {
    return tests;
  }

  const attemptsByTestId = new Map<string, PracticeAttempt[]>();

  attempts.forEach((attempt) => {
    if (!attempt.testId) {
      return;
    }

    const current = attemptsByTestId.get(attempt.testId) ?? [];
    attemptsByTestId.set(attempt.testId, [...current, attempt]);
  });

  return tests.map((test) => {
    const recentAttempts = attemptsByTestId.get(test.id);

    if (!recentAttempts?.length) {
      return test;
    }

    return {
      ...test,
      status: "Completed" as const,
      recentAttempts,
      completedAt: recentAttempts[0]?.attemptedAt
    };
  });
}

export function PracticeCatalog() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<PracticeFilter>("Listening & Reading");
  const [query, setQuery] = useState("");
  const [testsWithProgress, setTestsWithProgress] = useState<PracticeTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadTests() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const tests = await listPracticeTests();
        const attempts =
          isAuthenticated && !isAuthLoading ? await listRecentPracticeAttempts() : [];

        if (!cancelled) {
          setTestsWithProgress(mergeAttempts(tests, attempts));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, "Không tải được danh sách đề thi TOEIC.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!isAuthLoading) {
      loadTests();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthLoading]);

  const historyTests = useMemo(
    () =>
      testsWithProgress
        .filter((test) => test.status === "Completed")
        .sort((a, b) => getLatestAttemptTimestamp(b).localeCompare(getLatestAttemptTimestamp(a))),
    [testsWithProgress]
  );

  const visibleTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseTests =
      activeFilter === "Test History"
        ? historyTests
        : activeFilter === "Completed"
          ? testsWithProgress.filter((test) => test.status === "Completed")
          : testsWithProgress.filter((test) => test.type === activeFilter);

    return baseTests.filter((test) => {
      return (
        !normalizedQuery ||
        `${test.title} ${test.subtitle} ${test.type}`.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, historyTests, query, testsWithProgress]);

  useEffect(() => {
    const section = document.getElementById("practice");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentPage]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(visibleTests.length / itemsPerPage);

  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleTests.slice(start, start + itemsPerPage);
  }, [visibleTests, currentPage]);

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
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              className="glass-card w-full rounded-2xl px-12 py-4 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Tìm kiếm đề thi TOEIC..."
              type="text"
            />
            <button
              className="button-sheen absolute inset-y-2 right-3 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary/90"
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
                ? "Theo dõi các bài luyện thi đã hoàn thành để tiếp tục ôn tập đúng điểm yếu."
                : isCompletedView
                  ? "Danh sách các bài luyện thi đã hoàn thành, kèm điểm số và trạng thái review rõ ràng."
                  : "Luyện thi với các bộ đề TOEIC đã được nạp từ cơ sở dữ liệu."}
            </p>
          </div>

          <div className="glass-card grid w-full max-w-4xl grid-cols-1 gap-1 rounded-xl bg-surface-container-low p-1 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
            {practiceFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
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

        {isLoading ? (
          <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
            Đang tải danh sách đề thi từ backend...
          </div>
        ) : errorMessage ? (
          <div className="glass-card rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : isHistoryView ? (
          <HistoryList tests={paginatedTests} />
        ) : paginatedTests.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedTests.map((test) => (
              <PracticeTestCard key={test.id} test={test} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
            Chưa có đề thi phù hợp với bộ lọc hiện tại.
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              aria-label="Previous"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  aria-label={`Page ${pageNumber}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white",
                    currentPage === pageNumber && "border-primary bg-primary text-white hover:bg-primary"
                  )}
                  type="button"
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              aria-label="Next"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function PracticeTestCard({ test }: { test: PracticeTest }) {
  const completed = test.status === "Completed";
  const actionLabel = completed ? "Xem chi tiết" : "Bắt đầu làm";

  return (
    <article
      className={cn(
        "glass-card interactive-surface group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/50",
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
            "button-sheen mt-auto inline-flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-bold",
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
                "inline-flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-bold transition-colors md:w-36",
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
