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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/45 shadow-glass backdrop-blur-lg">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link
          href="/"
          className="text-display-lg-mobile font-extrabold tracking-tight text-primary md:text-display-lg"
        >
          TOEIC Green
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-1 text-label-md font-bold text-on-surface-variant transition hover:text-primary",
                pathname === item.href && "border-primary text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-label-md font-bold text-primary transition hover:bg-white/20"
          >
            Login
          </button>
          <button
            type="button"
            className="rounded-xl bg-primary px-6 py-2.5 text-label-md font-bold text-on-primary transition hover:scale-95 active:scale-90"
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-primary shadow-soft md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open ? (
        <div className="container-shell pb-5 md:hidden">
          <div className="glass-card grid gap-2 rounded-3xl p-3">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-bold text-on-surface hover:bg-primary-container/30",
                  pathname === item.href && "bg-primary-container/30 text-primary"
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
