import Image from "next/image";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { POS_LABELS } from "@/features/vocabulary/types";
import { playAudio } from "@/features/vocabulary/services/storage";
import type { ExploreWord } from "../types";
import { STATUS_BADGE, type WordLearnStatus } from "../lib/explore-view";

export function WordListCard({
  word,
  priority = false,
  status
}: {
  word: ExploreWord;
  priority?: boolean;
  status: WordLearnStatus;
}) {
  const badge = STATUS_BADGE[status];
  return (
    <article
      className={cn(
        "grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]",
        word.imageUrl && "md:grid-cols-[minmax(0,1fr)_180px] md:items-center"
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-extrabold text-ink">{word.word}</h3>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700">
            {POS_LABELS[word.partOfSpeech]}
          </span>
          {word.phonetic ? (
            <span className="text-sm font-bold text-muted">{word.phonetic}</span>
          ) : null}
          <button
            type="button"
            onClick={() => playAudio(word.audioUrl)}
            disabled={!word.audioUrl}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full",
              word.audioUrl
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "bg-slate-100 text-slate-300"
            )}
            title="Nghe phát âm"
          >
            <Volume2 size={15} />
          </button>
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-extrabold",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>

        <p className="mt-3 text-sm font-extrabold text-ink">Định nghĩa:</p>
        <p className="mt-1 text-sm leading-6 text-muted">{word.meaning}</p>

        {word.example ? (
          <>
            <p className="mt-3 text-sm font-extrabold text-ink">Ví dụ:</p>
            <p className="mt-1 text-sm leading-6 text-muted">{word.example}</p>
          </>
        ) : null}

        {word.exampleTranslation ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {word.exampleTranslation}
          </p>
        ) : null}
      </div>

      {word.imageUrl ? (
        <Image
          src={word.imageUrl}
          alt={word.word}
          width={240}
          height={160}
          priority={priority}
          className="h-32 w-full rounded-lg object-cover md:h-28"
        />
      ) : null}
    </article>
  );
}
