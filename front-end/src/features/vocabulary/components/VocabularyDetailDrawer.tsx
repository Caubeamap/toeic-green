import { Heart, Volume2, X, StickyNote, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VocabularyWord } from "../types";
import { STATUS_CONFIG, POS_LABELS } from "../types";

type DrawerProps = {
  word: VocabularyWord | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
};

export function VocabularyDetailDrawer({
  word,
  onClose,
  onToggleFavorite,
  onToggleMastered,
}: DrawerProps) {
  if (!word) return null;

  const statusCfg = STATUS_CONFIG[word.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-xl sm:rounded-l-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">Word Detail</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Word heading */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-extrabold text-ink">
                  {word.word}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {word.phonetic}
                  <span className="mx-1.5 text-zinc-300">·</span>
                  <span className="font-semibold text-academic-blue">
                    {POS_LABELS[word.partOfSpeech]}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(word.id)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition",
                    word.isFavorite
                      ? "bg-rose-50 text-rose-500"
                      : "bg-zinc-50 text-zinc-400 hover:text-rose-400"
                  )}
                >
                  <Heart
                    size={18}
                    fill={word.isFavorite ? "currentColor" : "none"}
                  />
                </button>
                <button className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-50 text-zinc-400 transition hover:text-growth-dark">
                  <Volume2 size={18} />
                </button>
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold",
                  statusCfg.bg,
                  statusCfg.color,
                  statusCfg.border
                )}
              >
                {statusCfg.label}
              </span>
              <button
                onClick={() => onToggleMastered(word.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-bold transition",
                  word.status === "mastered"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-growth hover:bg-growth/10 hover:text-growth-dark"
                )}
              >
                {word.status === "mastered"
                  ? "✓ Already Mastered"
                  : "Mark as Mastered"}
              </button>
            </div>
          </div>

          {/* Meaning section */}
          <section>
            <SectionLabel>Meaning (Vietnamese)</SectionLabel>
            <p className="mt-1.5 text-base font-semibold leading-relaxed text-ink">
              {word.meaning}
            </p>
          </section>

          {/* Example */}
          <section>
            <SectionLabel>Example Sentence</SectionLabel>
            <div className="mt-1.5 rounded-xl bg-zinc-50 px-4 py-3">
              <p className="text-sm italic leading-relaxed text-zinc-700">
                &ldquo;{word.example}&rdquo;
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {word.exampleTranslation}
              </p>
            </div>
          </section>

          {/* Tags */}
          <section>
            <SectionLabel>Topics</SectionLabel>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {word.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-lg bg-academic-blue/8 px-2.5 py-1 text-xs font-semibold text-academic-blue"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* Personal Note */}
          <section>
            <SectionLabel>
              <StickyNote size={14} className="inline mr-1 -mt-0.5" />
              Personal Note
            </SectionLabel>
            {word.note ? (
              <p className="mt-1.5 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-sm leading-relaxed text-zinc-600">
                {word.note}
              </p>
            ) : (
              <p className="mt-1.5 text-sm italic text-zinc-300">
                No notes yet.
              </p>
            )}
          </section>

          {/* Meta info */}
          <section className="rounded-xl bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock size={12} />
              <span>
                Added{" "}
                {new Date(word.addedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {word.lastReviewedAt && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span>
                    Last reviewed{" "}
                    {new Date(word.lastReviewedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
              <span className="text-zinc-300">·</span>
              <span>Reviewed {word.reviewCount}×</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
      {children}
    </p>
  );
}
