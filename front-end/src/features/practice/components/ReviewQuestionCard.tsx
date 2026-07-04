import { memo } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Flag,
  Headphones,
  Lightbulb,
  XCircle
} from "lucide-react";
import type { ToeicQuestion } from "@/features/practice/lib/toeic-questions";
import { isQuestionNumberOnlyStem, formatQuestionStem } from "@/features/practice/lib/toeic-questions";
import {
  getSmartExplanation,
  renderExplanationText,
  splitTranscript
} from "@/features/practice/lib/result-explanations";
import { cn } from "@/lib/utils";

/* Card 1 câu trong cột review. Memo hoá: khi đổi câu, chỉ 2 card có isCurrent đổi
   re-render thay vì toàn bộ ~30 card của part → hết jank khi duyệt câu. Mọi prop đều
   là giá trị tĩnh theo lượt làm bài (selected/isCorrect/isMarked) + handler ổn định,
   nên React.memo bỏ qua được phần lớn card. */
type ReviewQuestionCardProps = {
  q: ToeicQuestion;
  isCurrent: boolean;
  selected: string | undefined;
  isCorrect: boolean;
  isMarked: boolean;
  isTranscriptOpen: boolean;
  isExplanationOpen: boolean;
  onSelect: (id: string) => void;
  onToggleTranscript: (id: string) => void;
  onToggleExplanation: (id: string) => void;
};

export const ReviewQuestionCard = memo(function ReviewQuestionCard({
  q,
  isCurrent,
  selected,
  isCorrect,
  isMarked,
  isTranscriptOpen,
  isExplanationOpen,
  onSelect,
  onToggleTranscript,
  onToggleExplanation
}: ReviewQuestionCardProps) {
  const shouldShowStem = !isQuestionNumberOnlyStem(q);

  // Compact review row for Part 1/2
  if (q.partId === "part-1" || q.partId === "part-2") {
    return (
      <div
        id={`review-card-${q.questionNumber}`}
        onClick={() => {
          if (!isCurrent) onSelect(q.id);
        }}
        className={cn(
          "rounded-2xl border p-4 transition-colors duration-150 flex flex-col gap-3 shadow-soft cursor-pointer relative [content-visibility:auto] [contain-intrinsic-size:1px_180px] [contain:layout_paint]",
          isCurrent
            ? "border-primary/40 bg-white ring-2 ring-primary/5"
            : "border-outline-variant/20 bg-white/70 hover:border-outline-variant/50 hover:bg-white"
        )}
      >
        {isCurrent && (
          <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r bg-primary" />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black text-ink whitespace-nowrap">Question {q.questionNumber}</span>
            {isMarked && (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200">
                <Flag className="h-2.5 w-2.5 fill-current" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {q.options.map((opt) => {
              const isOptSelected = selected === opt.label;
              const isOptCorrect = q.correctAnswer === opt.label;
              return (
                <span
                  key={opt.label}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black border transition-colors duration-150 relative",
                    isOptCorrect
                      ? "bg-green-600 text-white border-green-600 shadow-soft"
                      : isOptSelected
                      ? "bg-red-500 text-white border-red-500 shadow-soft"
                      : "bg-surface-container-low text-muted border-outline-variant/40"
                  )}
                  title={opt.text}
                >
                  {opt.label}
                  {isOptCorrect && isOptSelected && (
                    <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center ring-1 ring-green-600">
                      <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                    </span>
                  )}
                  {!isOptCorrect && isOptSelected && (
                    <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center ring-1 ring-red-500">
                      <XCircle className="h-2.5 w-2.5 text-red-500" />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border self-end sm:self-auto shrink-0",
              selected
                ? isCorrect
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
                : "bg-zinc-50 text-zinc-500 border-zinc-200"
            )}
          >
            {selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa trả lời"}
          </span>
        </div>

        {/* Toggle Transcript and Translation for Part 1/2 */}
        {isCurrent && (() => {
          return (
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTranscript(q.id);
                }}
                className="inline-flex w-fit items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/10"
              >
                <Headphones className="h-3 w-3" />
                <span>{isTranscriptOpen ? "Ẩn Script & Dịch" : "Xem Script & Dịch"}</span>
              </button>

              {isTranscriptOpen && (
                <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3.5 space-y-2.5 animate-[fadeIn_0.2s_ease-out] text-[11px] font-semibold text-ink leading-relaxed">
                  {q.transcript && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-0.5">Lời thoại Tiếng Anh (Audio Script):</p>
                      <p className="italic text-ink font-bold">&ldquo;{q.transcript}&rdquo;</p>
                    </div>
                  )}
                  {getSmartExplanation(q, q.passage || q.transcript || "") && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Dịch nghĩa & Giải thích:</p>
                      <div className="text-ink/90 text-[13px] font-medium space-y-1.5">{renderExplanationText(getSmartExplanation(q, q.passage || q.transcript || ""))}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // Full card for Part 3-7
  return (
    <div
      id={`review-card-${q.questionNumber}`}
      onClick={() => {
        if (!isCurrent) onSelect(q.id);
      }}
      className={cn(
        "rounded-2xl border p-5 transition-colors duration-150 shadow-soft relative cursor-pointer [content-visibility:auto] [contain-intrinsic-size:1px_260px] [contain:layout_paint]",
        isCurrent
          ? "border-primary/40 bg-white ring-2 ring-primary/5"
          : "border-outline-variant/20 bg-white/70 hover:border-outline-variant/50 hover:bg-white"
      )}
    >
      {isCurrent && (
        <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r bg-primary" />
      )}

      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-ink">Question {q.questionNumber}</span>
          {isMarked && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200">
              <Flag className="h-3 w-3 fill-current" />
            </span>
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border",
            selected
              ? isCorrect
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
              : "bg-zinc-50 text-zinc-500 border-zinc-200"
          )}
        >
          {selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa trả lời"}
        </span>
      </div>

      {shouldShowStem && (
        <p className="text-xs font-bold leading-relaxed text-ink mb-4">
          {formatQuestionStem(q.stem)}
        </p>
      )}

      <div className="grid gap-2.5">
        {q.options.map((opt) => {
          const isOptSelected = selected === opt.label;
          const isOptCorrect = q.correctAnswer === opt.label;
          return (
            <div
              key={opt.label}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-xl border px-4 py-2.5 text-xs font-semibold leading-relaxed transition-colors",
                isOptCorrect
                  ? "border-green-500/40 bg-green-500/10 text-ink shadow-sm"
                  : isOptSelected
                  ? "border-red-400 bg-red-50 text-ink"
                  : "border-outline-variant/30 bg-white/50 text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                  isOptCorrect
                    ? "bg-green-600 text-white shadow-soft"
                    : isOptSelected
                    ? "bg-red-500 text-white shadow-soft"
                    : "bg-surface-container-highest text-muted"
                )}
              >
                {opt.label}
              </span>
              <span className="flex-1 text-[11px] font-bold">{opt.text}</span>
              {isOptCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
              {!isOptCorrect && isOptSelected && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Explanation & Transcript box */}
      {isCurrent && (() => {
        const isListening = ["part-3", "part-4"].includes(q.partId);
        const explanationText = getSmartExplanation(q, q.passage || q.transcript || "");

        if (isListening) {
          const { english } = splitTranscript(q.transcript);
          const displayScript = english || q.passage || "";
          return (
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTranscript(q.id);
                }}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10"
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>{isTranscriptOpen ? "Ẩn Script & Dịch" : "Xem Script & Dịch"}</span>
              </button>

              {isTranscriptOpen && (
                <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-3 animate-[fadeIn_0.2s_ease-out] text-xs font-semibold text-ink leading-relaxed">
                  {displayScript && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Lời thoại Tiếng Anh (Audio Script):</p>
                      <div className="bg-white/50 border border-outline-variant/10 rounded-lg p-2.5 italic text-ink font-bold whitespace-pre-line">
                        {displayScript}
                      </div>
                    </div>
                  )}
                  {explanationText && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Dịch nghĩa & Giải thích:</p>
                      <div className="bg-white/60 border border-outline-variant/15 rounded-lg p-3 text-ink/90 text-[13px] font-medium space-y-1.5">
                        {renderExplanationText(explanationText)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // Reading explanation (Part 5, 6, 7)
        return (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary-container/10 overflow-hidden shadow-soft">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExplanation(q.id);
              }}
              className="flex w-full items-center justify-between p-4 text-xs font-black text-primary hover:bg-primary-container/20 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span>Giải thích đáp án (Ngữ pháp & Vị trí)</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-primary transition-transform duration-200", isExplanationOpen && "rotate-180")} />
            </button>

            {isExplanationOpen && (
              <div className="border-t border-primary/10 p-4 pt-0 animate-[fadeIn_0.2s_ease-out]">
                <div className="mt-3 text-[13px] leading-relaxed text-ink/90 font-medium bg-white/60 border border-outline-variant/15 rounded-lg p-3 space-y-1.5">
                  {renderExplanationText(explanationText)}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
});
