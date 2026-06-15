import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Globe,
  GraduationCap,
  Headphones,
  Mail,
  PenLine,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  ClipboardCheck,
  Layers,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps Stitch / Material icon names to Lucide (no icon font required). */
const ICON_MAP: Record<string, LucideIcon> = {
  auto_awesome: Sparkles,
  arrow_forward: ArrowRight,
  trending_up: TrendingUp,
  headphones: Headphones,
  edit_note: PenLine,
  menu_book: BookOpen,
  history_edu: GraduationCap,
  verified: BadgeCheck,
  star: Star,
  public: Globe,
  alternate_email: Mail,
  share: Share2,
  fact_check: ClipboardCheck,
  style: Layers
};

type MaterialSymbolIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function MaterialSymbolIcon({ name, className, filled }: MaterialSymbolIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;

  const isStar = name === "star" && filled;

  return (
    <Icon
      className={cn("shrink-0", className)}
      strokeWidth={isStar ? 0 : 2}
      fill={isStar ? "currentColor" : "none"}
      aria-hidden
    />
  );
}
