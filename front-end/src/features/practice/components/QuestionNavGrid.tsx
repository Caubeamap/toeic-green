import { memo, useMemo } from "react";
import type { ToeicQuestion } from "../lib/toeic-questions";
import { cn } from "@/lib/utils";

export type AnswerMap = Record<string, string>; // questionId → selected option label
export type FlagSet = Set<string>; // questionId set

/* Lưới điều hướng 200 câu — memo hoá để không re-render mỗi tick audio.
   Dựng sẵn Map id→index (O(n)) thay vì gọi indexOf trong vòng lặp (O(n²)). */
export const QuestionNavGrid = memo(function QuestionNavGrid({
  questions,
  answers,
  flags,
  currentIndex,
  isNavigationBlocked,
  onGoTo
}: {
  questions: ToeicQuestion[];
  answers: AnswerMap;
  flags: FlagSet;
  currentIndex: number;
  isNavigationBlocked: boolean;
  onGoTo: (index: number) => void;
}) {
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q, idx) => map.set(q.id, idx));
    return map;
  }, [questions]);

  const renderButton = (q: ToeicQuestion) => {
    const idx = indexById.get(q.id) ?? 0;
    const isAns = !!answers[q.id];
    const isCurr = idx === currentIndex;
    const isMark = flags.has(q.id);
    return (
      <button
        key={q.id}
        type="button"
        disabled={isNavigationBlocked}
        onClick={() => onGoTo(idx)}
        title={`Question ${q.questionNumber}`}
        className={cn(
          "relative flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black transition-colors",
          isCurr
            ? "ring-2 ring-primary ring-offset-1 bg-white text-primary"
            : isAns
            ? "bg-primary text-white shadow-soft"
            : "bg-surface-container-highest/50 text-muted hover:bg-primary-container/20",
          isNavigationBlocked && "cursor-not-allowed opacity-90"
        )}
      >
        {q.questionNumber}
        {isMark && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm border border-white" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Listening Section Q1-100 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1">
          <span className="text-[10px] font-black uppercase text-primary tracking-wider">Listening Section</span>
          <span className="text-[9px] font-bold text-muted">Q1 - Q100</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.slice(0, 100).map(renderButton)}
        </div>
      </div>

      {/* Reading Section Q101-200 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1">
          <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Reading Section</span>
          <span className="text-[9px] font-bold text-muted">Q101 - Q200</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {questions.slice(100).map(renderButton)}
        </div>
      </div>
    </>
  );
});
