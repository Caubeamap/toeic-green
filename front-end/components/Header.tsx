"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/45 shadow-[0_20px_40px_rgba(26,42,108,0.08)] backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-growth-dark">
          TOEIC Green
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-1 text-sm font-bold text-muted transition hover:text-growth-dark",
                pathname === item.href && "border-growth-dark text-growth-dark"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <button className="rounded-xl px-4 py-2 text-sm font-bold text-growth-dark transition hover:bg-white/40">
            Login
          </button>
          <button className="rounded-xl bg-growth-dark px-6 py-2.5 text-sm font-bold text-white transition hover:scale-95">
            Sign up
          </button>
        </div>

        <button
          aria-label="Toggle menu"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-growth-dark shadow-soft md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open ? (
        <div className="container-shell pb-5 md:hidden">
          <div className="grid gap-2 rounded-[24px] border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur-xl">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-bold text-ink hover:bg-growth/20",
                  pathname === item.href && "bg-growth/20 text-growth-dark"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
