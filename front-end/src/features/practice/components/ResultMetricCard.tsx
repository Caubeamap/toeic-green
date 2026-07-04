import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ResultMetricCard({
  icon,
  title,
  value,
  subValue,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subValue: string;
  tone: "green" | "blue" | "emerald" | "purple";
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-white/60 p-4 shadow-soft">
      <div
        className={cn(
          "mb-3 flex h-8 w-8 items-center justify-center rounded-xl",
          tone === "green" && "bg-primary-container/40 text-on-primary-container",
          tone === "blue" && "bg-blue-50 text-blue-700 border border-blue-100",
          tone === "emerald" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
          tone === "purple" && "bg-purple-50 text-purple-700 border border-purple-100"
        )}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
      <p className="text-[10px] font-bold text-muted mt-0.5">{subValue}</p>
    </div>
  );
}
