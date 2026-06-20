"use client";

import { ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { navItems } from "@/lib/data";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  function isActivePath(href: string) {
    if (href === "/") return pathname === "/";

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 isolate border-b border-slate-200/80 bg-white shadow-glass [transform:translateZ(0)]">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="TOEIC Green"
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-container/40 ring-1 ring-primary/10">
            <Image
              src="/images/logo_toeic_green.webp"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
              priority
            />
          </span>
          <span className="text-headline-md font-extrabold tracking-tight text-primary md:text-headline-lg">
            TOEIC Green
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-4 lg:gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-1 text-label-md font-bold text-on-surface-variant transition hover:text-primary",
                isActivePath(item.href) && "border-primary text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth area — md để khớp nav + hamburger (tránh hiện trùng ở 640–767px) */}
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors hover:bg-black/5 focus:outline-none"
              >
                <UserAvatar
                  alt={`${user.displayName} avatar`}
                  avatarUrl={user.avatarUrl}
                  className="h-9 w-9 text-xs font-extrabold"
                  initials={user.avatar}
                />
                <span className="text-label-md font-bold text-on-surface">
                  {user.displayName}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-on-surface-variant transition-transform duration-200", showUserDropdown && "rotate-180")} />
              </button>

              {showUserDropdown && (
                <>
                  {/* Backdrop to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-white/40 bg-white/95 p-1.5 shadow-glass">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-label-md font-bold text-on-surface transition hover:bg-primary-container/25 hover:text-primary"
                    >
                      <UserRound className="h-4 w-4" />
                      Trang cá nhân
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-label-md font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-3" aria-label="Đang tải tài khoản">
              <div className="h-9 w-9 animate-pulse rounded-full bg-primary/10" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-label-md font-bold text-primary transition hover:bg-white/20"
              >
                Đăng nhập
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-xl bg-primary px-6 py-2.5 text-label-md font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                Đăng ký
              </Link>
            </>
          )}
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
                  isActivePath(item.href) && "bg-primary-container/30 text-primary"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile auth */}
            <div className="mt-1 border-t border-outline-variant/50 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <UserAvatar
                      alt={`${user.displayName} avatar`}
                      avatarUrl={user.avatarUrl}
                      className="h-8 w-8 text-xs font-extrabold"
                      initials={user.avatar}
                    />
                    <span className="text-sm font-bold text-on-surface">
                      {user.displayName}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface hover:bg-primary-container/30 hover:text-primary"
                  >
                    <UserRound className="h-4 w-4" />
                    Trang cá nhân
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </>
              ) : isLoading ? (
                <div className="flex items-center gap-3 px-4 py-3" aria-label="Đang tải tài khoản">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-2xl px-4 py-3 text-sm font-bold text-primary hover:bg-primary-container/30"
                    onClick={() => setOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="mt-1 block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-bold text-on-primary"
                    onClick={() => setOpen(false)}
                  >
                    Đăng ký tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
