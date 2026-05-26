"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Headphones,
  History,
  PenLine,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const practiceTabs = [
  { label: "Listening & Reading", icon: Headphones, active: true },
  { label: "Speaking & Writing", icon: PenLine },
  { label: "Test History", icon: History }
];

const filters = ["All", "Listening & Reading", "Speaking & Writing", "Completed"];

const etsTests = [
  ...[1, 2, 3].map((test) => ({ year: 2022, test })),
  ...[1, 2, 3].map((test) => ({ year: 2023, test })),
  ...[1, 2, 3].map((test) => ({ year: 2024, test })),
  ...[1, 2, 3].map((test) => ({ year: 2025, test })),
  ...[1, 2, 3, 4].map((test) => ({ year: 2026, test }))
].map((item, index) => ({
  id: `${item.year}-${item.test}`,
  title: `ETS TOEIC ${item.year}`,
  subtitle: `Test ${item.test}`,
  type: "Listening & Reading",
  shortType: "L & R",
  minutes: 120,
  questions: 200,
  access: "Free",
  completed: index === 2
}));

export function PracticeSection() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [query, setQuery] = useState("");

  const filteredTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return etsTests.filter((test) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Completed" && test.completed) ||
        activeFilter === test.type;

      const matchesQuery =
        !normalizedQuery ||
        `${test.title} ${test.subtitle}`.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  return (
    <section
      id="practice"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#f0fdf4_0%,#fbf9f8_46%),radial-gradient(circle_at_100%_100%,#eff6ff_0%,#fbf9f8_48%)] pb-20 pt-12"
    >
      <div className="container-shell">
        <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {practiceTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.label}
                className={cn(
                  "glass-card inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-label-md font-bold transition hover:bg-white/60",
                  tab.active
                    ? "border-primary/20 bg-primary-container/20 text-primary"
                    : "text-on-surface-variant"
                )}
                type="button"
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mb-12 max-w-2xl">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary transition group-focus-within:scale-110" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="glass-card w-full rounded-2xl px-12 py-4 text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Tìm kiếm đề thi (ví dụ: ETS 2024)..."
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
              Practice Tests
            </h1>
            <p className="max-w-xl text-body-md text-on-surface-variant">
              Sharpen your skills with our curated collection of full-length
              simulation tests designed to mirror the latest TOEIC standards.
            </p>
          </div>

          <div className="glass-card flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-5 py-2 text-label-md font-semibold text-on-surface-variant transition hover:text-on-surface",
                  activeFilter === filter && "bg-white font-bold text-primary shadow-sm"
                )}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTests.map((test) => (
            <article
              key={test.id}
              className="glass-card group overflow-hidden rounded-2xl border border-white/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {test.shortType}
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {test.access}
                  </span>
                </div>

                <h3 className="mb-1 text-lg font-bold leading-tight text-on-surface">
                  {test.title}
                </h3>
                <p className="mb-4 text-sm text-on-surface-variant">{test.subtitle}</p>

                <div className="mb-6 space-y-2 text-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-[18px] w-[18px]" />
                    <span>{test.minutes} phút</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-[18px] w-[18px]" />
                    <span>{test.questions} câu hỏi</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-lg border border-primary/30 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5"
                    type="button"
                  >
                    Chi tiết
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                    type="button"
                  >
                    Start
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

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
