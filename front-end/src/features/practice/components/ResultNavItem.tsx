import { memo } from "react";
import { cn } from "@/lib/utils";

/* Một ô trong bảng điều hướng câu (answer sheet). Memo hoá: khi đổi câu chỉ 2 ô
   có isSelected thay đổi re-render, 198 ô còn lại bỏ qua → hết jank khi điều hướng. */
export const ResultNavItem = memo(function ResultNavItem({
  questionNumber,
  index,
  isSelected,
  status,
  onGoTo
}: {
  questionNumber: number;
  index: number;
  isSelected: boolean;
  status: "correct" | "wrong" | "none";
  onGoTo: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onGoTo(index)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "relative flex h-8 w-full items-center justify-center rounded-xl text-[10px] font-black transition-colors",
        isSelected ? "ring-2 ring-primary ring-offset-1 text-ink bg-primary-container/60" : "",
        status === "none"
          ? "bg-surface-container-low text-muted hover:bg-primary-container/35 hover:text-primary"
          : status === "correct"
          ? "bg-green-600 text-white shadow-soft"
          : "bg-red-500 text-white shadow-soft"
      )}
    >
      {questionNumber}
    </button>
  );
});
