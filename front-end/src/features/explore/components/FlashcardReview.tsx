"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  RotateCcw,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POS_LABELS } from "@/features/vocabulary/types";
import { playAudio } from "@/features/vocabulary/services/storage";
import type { ExploreCollection, ExploreWord, FlashcardRating } from "../types";
import { ratingActions } from "../lib/explore-view";

export function FlashcardReview({
  collection,
  currentWord,
  currentWordIndex,
  deckSize,
  knownWords,
  progressPercent,
  showAnswer,
  backHref,
  isResettingKnown,
  onToggleAnswer,
  onMoveWord,
  onRate,
  onResetKnown,
  onClose
}: {
  collection: ExploreCollection;
  currentWord: ExploreWord;
  currentWordIndex: number;
  deckSize: number;
  knownWords: number;
  progressPercent: number;
  showAnswer: boolean;
  backHref: string;
  isResettingKnown: boolean;
  onToggleAnswer: () => void;
  onMoveWord: (direction: "previous" | "next") => void;
  onRate: (rating: FlashcardRating) => void;
  onResetKnown: () => void;
  onClose: () => void;
}) {
  // Ảnh ví dụ mặt sau được mount sẵn (cùng lúc thẻ hiện ra) nên tải nền ngay
  // trong lúc người dùng còn xem mặt trước → khi lật, ảnh đã sẵn sàng cùng nghĩa.
  // Reset cờ ngay trong render khi đổi từ (theo pattern điều chỉnh state khi prop
  // đổi của React) để tránh setState trong effect gây render dây chuyền.
  const [isImageReady, setImageReady] = useState(!currentWord.imageUrl);
  const [trackedImageUrl, setTrackedImageUrl] = useState(currentWord.imageUrl);
  if (trackedImageUrl !== currentWord.imageUrl) {
    setTrackedImageUrl(currentWord.imageUrl);
    setImageReady(!currentWord.imageUrl);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-container text-primary">
                <Layers size={18} />
              </span>
              <h2 className="text-xl font-extrabold text-ink">
                Luyện tập: {collection.title}
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">
              {currentWordIndex + 1}/{deckSize} từ cần ôn · {knownWords} từ đã biết
            </p>
          </div>

          {knownWords > 0 ? (
            <button
              type="button"
              onClick={onResetKnown}
              disabled={isResettingKnown}
              className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              title="Đưa các từ đã biết trở lại danh sách ôn"
            >
              {isResettingKnown ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Ôn lại từ đã biết
            </button>
          ) : null}
        </div>

        <div className="mt-5 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-[#fbfcfd] p-4 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
              Từ mới
            </span>
            <button
              type="button"
              onClick={() => playAudio(currentWord.audioUrl)}
              disabled={!currentWord.audioUrl}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                currentWord.audioUrl
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-slate-100 text-slate-300"
              )}
              title="Nghe phát âm"
            >
              <Volume2 size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleAnswer}
            aria-pressed={showAnswer}
            className="mt-5 block min-h-[320px] w-full rounded-xl bg-white text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,1)] [perspective:1400px]"
          >
            <div
              className={cn(
                "grid min-h-[320px] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-reduce:transition-none",
                showAnswer && "[transform:rotateY(180deg)]"
              )}
            >
              {/* Mặt trước: từ + phiên âm. Cả hai mặt cùng nằm trong 1 ô grid
                  (1/1) nên container cao bằng mặt cao nhất và giữ auto-height. */}
              <div className="col-start-1 row-start-1 grid place-items-center px-5 [backface-visibility:hidden] [transform:translateZ(0.01px)]">
                <div>
                  <h3 className="text-3xl font-extrabold text-ink md:text-4xl">
                    {currentWord.word}
                  </h3>
                  <p className="mt-4 text-lg font-bold text-muted">
                    ({POS_LABELS[currentWord.partOfSpeech]}) {currentWord.phonetic}
                  </p>
                </div>
              </div>

              {/* Mặt sau: nghĩa + ví dụ + ảnh. Mount sẵn nên ảnh tải nền ngay. */}
              <div
                className={cn(
                  "col-start-1 row-start-1 grid w-full gap-6 p-5 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]",
                  currentWord.imageUrl &&
                    "md:grid-cols-[minmax(0,1fr)_200px] md:items-center lg:grid-cols-[minmax(0,1fr)_240px]"
                )}
              >
                <div>
                  <h3 className="text-2xl font-extrabold text-ink">
                    {currentWord.word}
                  </h3>
                  <p className="mt-3 text-sm font-extrabold text-ink">
                    Định nghĩa:
                  </p>
                  <p className="mt-1 text-base leading-7 text-muted">
                    {currentWord.meaning}
                  </p>
                  {currentWord.example ? (
                    <>
                      <p className="mt-4 text-sm font-extrabold text-ink">
                        Ví dụ:
                      </p>
                      <p className="mt-1 text-base leading-7 text-muted">
                        {currentWord.example}
                      </p>
                    </>
                  ) : null}
                  {currentWord.exampleTranslation ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {currentWord.exampleTranslation}
                    </p>
                  ) : null}
                </div>
                {currentWord.imageUrl ? (
                  <div className="relative h-44 w-full overflow-hidden rounded-lg bg-slate-100">
                    {!isImageReady ? (
                      <div className="absolute inset-0 animate-pulse bg-slate-100" />
                    ) : null}
                    <Image
                      src={currentWord.imageUrl}
                      alt={currentWord.word}
                      width={320}
                      height={220}
                      className={cn(
                        "h-44 w-full object-cover transition-opacity duration-200",
                        isImageReady ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageReady(true)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </button>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onMoveWord("previous")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-muted transition hover:border-primary hover:text-primary"
              title="Từ trước"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              onClick={onToggleAnswer}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink transition hover:border-primary/35 hover:text-primary"
            >
              <RotateCcw size={16} />
              {showAnswer ? "Ẩn nghĩa" : "Xem nghĩa"}
            </button>
            <button
              type="button"
              onClick={() => onMoveWord("next")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-muted transition hover:border-primary hover:text-primary"
              title="Từ tiếp theo"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {ratingActions.map((action) => (
            <button
              key={action.rating}
              type="button"
              onClick={() => onRate(action.rating)}
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-extrabold transition",
                action.className
              )}
            >
              <action.icon size={18} />
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
