import { Heart, Volume2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VocabularyWord } from "../types";
import { STATUS_CONFIG, POS_LABELS } from "../types";
import { playAudio } from "../services/storage";

type CardProps = {
  word: VocabularyWord;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onViewDetail: (word: VocabularyWord) => void;
};

export function VocabularyCard({
  word,
  onToggleFavorite,
  onToggleMastered,
  onViewDetail,
}: CardProps) {
  const statusCfg = STATUS_CONFIG[word.status];

  const hasExample = !!word.example?.trim();

  return (
    <article
      className="group rounded-2xl border border-zinc-100 bg-white p-4 transition hover:border-zinc-200 hover:shadow-sm"
      role="article"
      aria-label={`Vocabulary card: ${word.word}`}
    >
      {/* Top row: status + actions */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
            statusCfg.bg,
            statusCfg.color,
            statusCfg.border
          )}
        >
          {statusCfg.label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(word.id)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg transition",
              word.isFavorite
                ? "text-rose-500"
                : "text-zinc-300 hover:text-rose-400"
            )}
            title={word.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart
              size={16}
              fill={word.isFavorite ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={() => playAudio(word.audioUrl)}
            disabled={!word.audioUrl}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg transition",
              word.audioUrl
                ? "text-zinc-400 hover:text-growth-dark"
                : "text-zinc-200 cursor-default"
            )}
            title={word.audioUrl ? "Phát âm" : "Không có âm thanh"}
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      {/* Word + phonetic + POS */}
      <div className="mt-2.5">
        <h3 className={cn(
          "font-extrabold text-ink leading-tight",
          hasExample ? "text-xl" : "text-2xl font-black tracking-tight"
        )}>
          {word.word}
        </h3>
        <p className={cn(
          "mt-0.5 text-zinc-500",
          hasExample ? "text-sm" : "text-base"
        )}>
          <span className="font-medium">{word.phonetic}</span>
          <span className="mx-1.5 text-zinc-300">·</span>
          <span className="font-semibold text-academic-blue">
            {POS_LABELS[word.partOfSpeech]}
          </span>
        </p>
      </div>

      {/* Meaning */}
      <p className={cn(
        "font-semibold leading-relaxed text-ink",
        hasExample ? "mt-2.5 text-sm" : "mt-3 text-base"
      )}>
        {word.meaning}
      </p>

      {/* Example */}
      {hasExample && (
        <div className="mt-2.5 rounded-lg bg-zinc-50 px-3 py-1.5">
          <p className="text-sm italic leading-relaxed text-zinc-600">
            &ldquo;{word.example}&rdquo;
          </p>
          {word.exampleTranslation?.trim() && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {word.exampleTranslation}
            </p>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
        <button
          onClick={() => onToggleMastered(word.id)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold transition",
            word.status === "mastered"
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-zinc-100 text-zinc-500 hover:bg-growth/10 hover:text-growth-dark"
          )}
        >
          {word.status === "mastered" ? "✓ Đã thuộc" : "Đánh dấu đã thuộc"}
        </button>
        <button
          onClick={() => onViewDetail(word)}
          className="inline-flex items-center gap-0.5 text-xs font-bold text-academic-blue transition hover:text-growth-dark"
        >
          Chi tiết
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}
