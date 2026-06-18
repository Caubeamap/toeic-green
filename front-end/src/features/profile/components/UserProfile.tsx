"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  Edit3,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { usePracticeStats } from "@/features/practice";
import { useVocabularyWords } from "@/features/vocabulary/hooks/useVocabulary";
import type { VocabularyWord } from "@/features/vocabulary/types";
import { cn } from "@/lib/utils";
import { loadUserProfile, getDefaultUserProfile } from "../services/profile";
import type { UserProfile as UserProfileData } from "../types";

const bannerTones: Record<UserProfileData["bannerTone"], string> = {
  mint: "bg-[#eafaf1]",
  sky: "bg-[#edf4fe]",
  sunrise: "bg-[#fff9f2]"
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
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [loadedProfile, setLoadedProfile] = useState<{
    profile: UserProfileData;
    userId: string;
  } | null>(null);

  // Từ vựng + số lượt luyện dùng chung cache React Query với Vocabulary/Progress.
  const vocabQuery = useVocabularyWords();
  const attemptCount = usePracticeStats().data?.totalAttempts ?? 0;

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    loadUserProfile(user)
      .then((nextProfile) => {
        if (!cancelled) {
          setLoadedProfile({ profile: nextProfile, userId: user.id });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedProfile({
            profile: getDefaultUserProfile(user),
            userId: user.id
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const profile =
    loadedProfile && loadedProfile.userId === user?.id
      ? loadedProfile.profile
      : null;

  const stats = useMemo<ProfileStats>(() => {
    if (!user) {
      return emptyStats;
    }

    return {
      ...getProfileStats(vocabQuery.data ?? []),
      attempts: attemptCount
    };
  }, [user, vocabQuery.data, attemptCount]);

  const profileDetails = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      {
        icon: UserRound,
        label: "Họ và tên",
        value: profile.displayName
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

  if (isLoading || !isAuthenticated || !user || !profile) {
    return (
      <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
        <div className="container-shell">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-muted">
              {isAuthenticated ? "Đang tải hồ sơ..." : "Đang chuyển hướng..."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20 pt-28">
      <div className="container-shell">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className={cn("relative h-36 overflow-hidden", bannerTones[profile.bannerTone])}>
            {/* Minimalist Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            {/* Elegant Minimalist Geometric Circles (No blur, just clean border) */}
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full border border-black/[0.04] bg-black/[0.005]" />
            <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full border border-black/[0.03] bg-black/[0.005]" />
            
            <div className="absolute right-10 -bottom-10 h-32 w-32 rounded-full border border-black/[0.04] bg-black/[0.005]" />
            <div className="absolute right-20 -bottom-5 h-20 w-20 rounded-full border border-black/[0.03] bg-black/[0.005]" />
            
            {/* Simple Bottom border line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-200/60" />
          </div>

          <div className="px-5 pb-7 sm:px-8">
            <div className="relative -mt-16 flex flex-col items-center text-center">
              <div className="relative">
                <div className="grid h-32 w-32 place-items-center rounded-full border-4 border-white bg-[#d4f9d2] text-3xl font-extrabold text-primary shadow-soft">
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
