import { ArrowDownUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortOption, StatusFilter } from "../types";
import { SORT_OPTIONS } from "../types";

type ToolbarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "learning", label: "Learning" },
  { value: "mastered", label: "Mastered" },
  { value: "favorites", label: "Favorites" },
];

export function VocabularyToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
}: ToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-4 lg:p-5">
      {/* Search + Sort row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 text-sm font-medium text-ink outline-none transition placeholder:text-zinc-400 focus:border-growth-dark focus:bg-white focus:ring-2 focus:ring-growth/20"
            placeholder="Search words, meanings, examples..."
          />
        </label>
        <div className="relative shrink-0">
          <ArrowDownUp
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={16}
          />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-8 text-sm font-semibold text-ink outline-none transition focus:border-growth-dark focus:ring-2 focus:ring-growth/20 sm:w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((item) => (
          <button
            key={item.value}
            onClick={() => onStatusChange(item.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition",
              statusFilter === item.value
                ? "bg-growth-dark text-white"
                : "bg-zinc-100 text-muted hover:bg-zinc-200"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
