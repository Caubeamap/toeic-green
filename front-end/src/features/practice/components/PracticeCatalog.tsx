"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Search
} from "lucide-react";
import Link from "next/link";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUrlState } from "@/lib/url-state";
import { practiceFilters, type PracticeFilter, type PracticeTest } from "../lib/practice-tests";
import { usePracticeCatalog } from "../hooks/usePractice";

function getLatestAttemptTimestamp(test: PracticeTest) {
  const [latestAttempt] = test.recentAttempts ?? [];

  return latestAttempt?.timestamp ?? test.completedAt ?? "";
}

export function PracticeCatalog({
  initialTests,
  initialProgressTests
}: {
  initialTests?: PracticeTest[];
  initialProgressTests?: PracticeTest[];
}) {
  const { searchParams, setParams } = useUrlState();

  // Hybrid: public list từ SSR (initialData) hiển thị tức thì; tiến độ phủ lên
  // qua React Query khi đã đăng nhập. Cache RAM, không localStorage.
  const { tests, isLoading, isUserProgressPending, error } =
    usePracticeCatalog(initialTests, initialProgressTests);
  const errorMessage = error
    ? getErrorMessage(error, "Không tải được danh sách đề thi TOEIC.")
    : null;

  // Bộ lọc, tìm kiếm và trang đều lấy từ URL (?filter=, ?q=, ?page=)
  const filterParam = searchParams.get("filter");
  const activeFilter: PracticeFilter = (
    practiceFilters as readonly PracticeFilter[]
  ).includes((filterParam ?? "") as PracticeFilter)
    ? (filterParam as PracticeFilter)
    : "Listening & Reading";
  const query = searchParams.get("q") ?? "";

  const setFilter = (filter: PracticeFilter) => {
    // Đổi bộ lọc thì luôn quay về trang 1.
    setParams({
      filter: filter === "Listening & Reading" ? null : filter,
      page: null
    });
  };
  const setQuery = (value: string) => {
    // Gõ tìm kiếm dùng replace để không làm rác lịch sử trình duyệt.
    setParams({ q: value || null, page: null }, { replace: true });
  };
  const setPage = (page: number) => {
    setParams({ page: page <= 1 ? null : page });
  };

  const historyTests = useMemo(
    () =>
      tests
        .filter((test) => test.status === "Completed")
        .sort((a, b) => getLatestAttemptTimestamp(b).localeCompare(getLatestAttemptTimestamp(a))),
    [tests]
  );

  const visibleTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseTests =
      activeFilter === "Test History"
        ? historyTests
        : activeFilter === "Completed"
          ? tests.filter((test) => test.status === "Completed")
          : tests.filter((test) => test.type === activeFilter);

    return baseTests.filter((test) => {
      return (
        !normalizedQuery ||
        `${test.title} ${test.subtitle} ${test.type}`.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, historyTests, query, tests]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(visibleTests.length / itemsPerPage);
  // Kẹp trang trong [1, totalPages] để URL ?page= sai/quá giới hạn vẫn an toàn.
  const currentPage = Math.min(
    Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, 1),
    Math.max(totalPages, 1)
  );

  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleTests.slice(start, start + itemsPerPage);
  }, [visibleTests, currentPage]);

  const pageRange = useMemo(() => {
    const maxVisible = 5; // Số trang tối đa hiển thị cùng lúc
    const range: number[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      let start = currentPage - 2;
      let end = currentPage + 2;
      
      if (start < 1) {
        start = 1;
        end = maxVisible;
      } else if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
    }
    return range;
  }, [currentPage, totalPages]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const section = document.getElementById("practice");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentPage]);

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
              onChange={(event) => setQuery(event.target.value)}
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

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
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
                  : "Luyện thi với các bộ đề TOEIC đã sẵn sàng để bắt đầu."}
            </p>
          </div>

          <div className="glass-card grid w-full gap-1 rounded-xl bg-surface-container-low p-1 grid-cols-2 sm:flex sm:w-fit sm:flex-row shrink-0">
            {practiceFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setFilter(filter)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-label-md font-semibold text-on-surface-variant transition hover:bg-white/50 hover:text-on-surface",
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PracticeTestCardSkeleton key={index} />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="glass-card rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : isUserProgressPending && (isHistoryView || isCompletedView) ? (
          <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
            Đang đồng bộ trạng thái bài đã làm
          </div>
        ) : isHistoryView ? (
          <HistoryList tests={paginatedTests} />
        ) : paginatedTests.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedTests.map((test) => (
              <PracticeTestCard
                key={test.id}
                test={test}
                isUserProgressPending={isUserProgressPending}
              />
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
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {pageRange.map((pageNumber) => (
              <button
                key={pageNumber}
                aria-label={`Page ${pageNumber}`}
                onClick={() => setPage(pageNumber)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-white",
                  currentPage === pageNumber && "border-primary bg-primary text-white hover:bg-primary"
                )}
                type="button"
              >
                {pageNumber}
              </button>
            ))}

            <button
              aria-label="Next"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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

const PracticeTestCard = memo(function PracticeTestCard({
  test,
  isUserProgressPending
}: {
  test: PracticeTest;
  isUserProgressPending: boolean;
}) {
  const completed = test.status === "Completed";
  const actionLabel = isUserProgressPending
    ? "Đang đồng bộ"
    : completed
      ? "Xem chi tiết"
      : "Bắt đầu làm";

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

        {isUserProgressPending ? (
          <span className="mt-auto inline-flex w-full cursor-wait items-center justify-center rounded-lg border border-outline-variant/70 bg-white/45 py-2.5 text-sm font-bold text-on-surface-variant">
            {actionLabel}
          </span>
        ) : (
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
        )}
      </div>
    </article>
  );
});

const HistoryList = memo(function HistoryList({ tests }: { tests: PracticeTest[] }) {
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
});

function PracticeTestCardSkeleton() {
  return (
    <div className="glass-card flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 p-5 animate-pulse bg-white/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="h-5 w-12 rounded bg-slate-100" />
        <div className="h-5 w-16 rounded bg-slate-100" />
      </div>
      <div className="mb-2 h-6 w-3/4 rounded bg-slate-100" />
      <div className="mb-4 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mb-5 space-y-2">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-4 w-28 rounded bg-slate-100" />
      </div>
      <div className="mt-auto h-10 w-full rounded-lg bg-slate-100" />
    </div>
  );
}
