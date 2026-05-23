import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-growth text-academic-blue shadow-glow hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(142,245,136,0.48)]",
  secondary:
    "glass-panel text-ink hover:bg-white/70 hover:-translate-y-0.5",
  dark: "bg-growth-dark text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#006d1e]",
  ghost: "text-growth-dark hover:bg-growth/18"
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
