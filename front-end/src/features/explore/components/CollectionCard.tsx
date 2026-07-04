import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExploreCollectionSummary } from "../types";
import { formatNumber } from "../lib/explore-view";

export function CollectionCard({
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
