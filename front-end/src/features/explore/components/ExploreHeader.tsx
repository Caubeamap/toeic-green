import { CopyCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExploreHeader({ compact }: { compact: boolean }) {
  return (
    <div className={cn("container-shell pt-8", compact && "pt-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-growth/15">
              <CopyCheck size={18} className="text-growth-dark" />
            </span>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Bộ thẻ từ vựng
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Học từ vựng qua các bộ thẻ ghi nhớ chia theo chủ đề, ôn luyện trực quan trước khi bước vào giải đề.
          </p>
        </div>
      </div>
    </div>
  );
}
