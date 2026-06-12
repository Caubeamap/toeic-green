import { BookOpen, Heart, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsProps = {
  total: number;
  mastered: number;
  favorites: number;
};

const statItems = [
  {
    key: "total",
    label: "Total Words",
    icon: BookOpen,
    color: "text-growth-dark",
    bg: "bg-growth/10",
  },
  {
    key: "mastered",
    label: "Mastered",
    icon: Star,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
] as const;

export function VocabularyStats({ total, mastered, favorites }: StatsProps) {
  const values: Record<string, number> = { total, mastered, favorites };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5"
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                item.bg
              )}
            >
              <Icon size={18} className={item.color} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-ink">
                {values[item.key]}
              </p>
              <p className="text-xs font-semibold text-muted">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
