"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  Edit3,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { loadPracticeAttempts } from "@/features/practice";
import { loadWords } from "@/features/vocabulary/services/storage";
import type { VocabularyWord } from "@/features/vocabulary/types";
import { cn } from "@/lib/utils";
import { loadUserProfile } from "../services/profile";
import type { UserProfile as UserProfileData } from "../types";

const bannerTones: Record<UserProfileData["bannerTone"], string> = {
  mint: "from-[#baf7c3] via-[#e9fff0] to-[#d7efff]",
  sky: "from-[#dce9ff] via-[#f6f8ff] to-[#c6f0ff]",
  sunrise: "from-[#ffe1c4] via-[#fff7df] to-[#cdf8e0]"
};

type ProfileStats = {
  attempts: number;
  masteredWords: number;
  savedWords: number;
};

const emptyStats: ProfileStats = {
  attempts: 0,
  masteredWords: 0,
  savedWords: 0
};

function getProfileStats(words: VocabularyWord[]): Pick<ProfileStats, "masteredWords" | "savedWords"> {
  return {
    masteredWords: words.filter((word) => word.status === "mastered").length,
    savedWords: words.length
  };
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function UserProfile() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>(emptyStats);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!user) {
        setProfile(null);
        setStats(emptyStats);
        return;
      }

      const nextProfile = loadUserProfile(user);
      const words = loadWords();
      const vocabularyStats = getProfileStats(words);

      setProfile(nextProfile);
      setStats({
        ...vocabularyStats,
        attempts: loadPracticeAttempts().length
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  const profileDetails = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      {
        icon: UserRound,
        label: "Tên người dùng",
        value: profile.username
      },
      {
        icon: Mail,
        label: "Email",
        value: profile.email || "Chưa liên kết email"
      },
      {
        icon: CalendarDays,
        label: "Cập nhật lần cuối",
        value: formatDate(profile.updatedAt)
      }
    ];
  }, [profile]);

  if (isLoading) {
    return (
      <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
        <div className="container-shell">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-muted">Đang tải hồ sơ...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated || !user || !profile) {
    return (
      <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
        <div className="container-shell">
          <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-container text-primary">
              <LogIn className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold text-ink">
              Đăng nhập để xem trang cá nhân
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Hồ sơ cá nhân sẽ hiển thị thông tin tài khoản và hoạt động học tập của bạn.
            </p>
            <Link
              href="/login?next=/profile"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
      <div className="container-shell">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className={cn("relative h-36 bg-gradient-to-r", bannerTones[profile.bannerTone])}>
            <div className="absolute -left-12 top-0 h-40 w-64 -skew-x-12 bg-primary/80" />
            <div className="absolute left-48 top-0 h-40 w-56 -skew-x-12 bg-secondary/80" />
            <div className="absolute right-0 top-0 h-40 w-80 -skew-x-12 bg-[#ff8f5f]/90" />
          </div>

          <div className="px-5 pb-7 sm:px-8">
            <div className="relative -mt-16 flex flex-col items-center text-center">
              <div className="relative">
                <div className="grid h-32 w-32 place-items-center rounded-full border-4 border-white bg-black text-3xl font-extrabold text-white shadow-soft">
                  {profile.avatar}
                </div>
                <Link
                  href="/profile/edit"
                  aria-label="Chỉnh sửa thông tin cá nhân"
                  className="absolute bottom-2 right-0 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-ink shadow-soft transition hover:border-primary/40 hover:text-primary"
                >
                  <Edit3 className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <h1 className="text-3xl font-extrabold text-ink">
                  {profile.displayName}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container/40 px-3 py-1.5 text-xs font-extrabold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Trang công khai
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                {profile.bio || "Người học TOEIC Green. Bạn có thể cập nhật phần giới thiệu để hồ sơ cá nhân rõ ràng hơn."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">
                  Hồ sơ
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink">
                  Thông tin cá nhân
                </h2>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
              >
                <Edit3 className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {profileDetails.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-muted">{item.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">
                  Hoạt động
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-ink">
                  Tóm tắt học tập
                </h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-container/45 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <ProfileMetric
                icon={BookOpenCheck}
                label="Từ vựng đã lưu"
                value={stats.savedWords}
              />
              <ProfileMetric
                icon={ShieldCheck}
                label="Từ đã thuộc"
                value={stats.masteredWords}
              />
              <ProfileMetric
                icon={CalendarDays}
                label="Lượt luyện trong phiên"
                value={stats.attempts}
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ProfileMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-bold text-muted">{label}</span>
      </div>
      <span className="text-xl font-extrabold text-ink">{value}</span>
    </div>
  );
}
