"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  FileText,
  History,
  ListChecks,
  LogIn,
  PlayCircle,
  Target,
  Timer,
  Trophy
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PracticeAttempt } from "@/features/practice/lib/practice-tests";
import type { VocabularyWord } from "@/features/vocabulary/types";
import { useAuth } from "@/features/auth/hooks/auth";
import { cn } from "@/lib/utils";
import {
  emptyPracticeStats,
  fetchProgress,
  readCachedProgress,
  type ProgressData
} from "../services/progress-api";

type ActivityDay = {
  key: string;
  label: string;
  attempts: number;
  vocabulary: number;
  total: number;
};

function getAccuracy(attempt: PracticeAttempt) {
  return attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : 0;
}

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.max(0, Math.round(totalSeconds / 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} phút`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}p` : `${hours}h`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toValidDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timestampValue(value?: string) {
  return toValidDate(value)?.getTime() ?? 0;
}

function buildActivityDays(
  attempts: PracticeAttempt[],
  words: VocabularyWord[]
): ActivityDay[] {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      date,
      key: dateKey(date),
      label: date.toLocaleDateString("vi-VN", { weekday: "short" })
    };
  });

  return days.map((day) => {
    const attemptsOnDay = attempts.filter((attempt) => {
      const date = toValidDate(attempt.timestamp);
      return date ? dateKey(date) === day.key : false;
    }).length;

    const vocabularyOnDay = words.filter((word) => {
      const addedAt = toValidDate(word.addedAt);
      const reviewedAt = toValidDate(word.lastReviewedAt);

      return (
        (addedAt ? dateKey(addedAt) === day.key : false) ||
        (reviewedAt ? dateKey(reviewedAt) === day.key : false)
      );
    }).length;

    return {
      key: day.key,
      label: day.label,
      attempts: attemptsOnDay,
      vocabulary: vocabularyOnDay,
      total: attemptsOnDay + vocabularyOnDay
    };
  });
}

function getStatusMessage({
  attempts,
  averageAccuracy,
  learningWords
}: {
  attempts: number;
  averageAccuracy: number | null;
  learningWords: number;
}) {
  if (attempts === 0) {
    return {
      title: "Bắt đầu luyện thôi",
      copy: "Làm thử một đề để trang này bắt đầu ghi lại tiến độ của bạn."
    };
  }

  if (averageAccuracy !== null && averageAccuracy < 60) {
    return {
      title: "Tập trung vào độ chính xác",
      copy: "Làm các đề ngắn, xem kỹ câu sai và ghi lại từ mới sau mỗi lượt."
    };
  }

  if (learningWords > 0) {
    return {
      title: "Đừng quên ôn từ",
      copy: `Bạn còn ${learningWords} từ đang học trong sổ từ vựng.`
    };
  }

  return {
    title: "Bạn đang đi đúng hướng",
    copy: "Giữ nhịp luyện đều và thỉnh thoảng làm full test để xem điểm tới đâu."
  };
}

export function ProgressOverview() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Chờ auth xác định trạng thái rồi mới quyết định gọi API hay không.
    if (isLoading) return;

    let cancelled = false;

    const load = async () => {
      if (!isAuthenticated || !userId) {
        // Khách: không gọi API (tránh 401), hiển thị lời mời đăng nhập.
        setData(null);
        setIsLoaded(true);
        return;
      }

      // Paint tức thì từ cache (nếu có) rồi revalidate nền.
      const cached = readCachedProgress(userId);
      if (cached && !cancelled) {
        setData(cached);
        setIsLoaded(true);
      }

      try {
        const fresh = await fetchProgress(userId);
        if (!cancelled) {
          setData(fresh);
          setIsLoaded(true);
        }
      } catch {
        // Giữ dữ liệu cache (nếu có); chỉ đánh dấu đã tải xong.
        if (!cancelled) setIsLoaded(true);
      }
    };

    // setState được hoãn ra ngoài thân effect (eslint react-hooks/set-state-in-effect).
    const timer = window.setTimeout(() => void load(), 0);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, isLoading, userId]);

  const progress = useMemo(() => {
    const stats = data?.stats ?? emptyPracticeStats;
    const words = data?.words ?? [];
    const attempts = [...(data?.attempts ?? [])].sort(
      (a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp)
    );
    const masteredWords = words.filter((word) => word.status === "mastered").length;
    const learningWords = words.filter((word) => word.status === "learning").length;
    const favoriteWords = words.filter((word) => word.isFavorite).length;
    const activityDays = buildActivityDays(attempts, words);
    const activeDays = activityDays.filter((day) => day.total > 0).length;
    const status = getStatusMessage({
      attempts: stats.totalAttempts,
      averageAccuracy: stats.averageAccuracy,
      learningWords
    });

    return {
      activeDays,
      activityDays,
      attempts,
      averageAccuracy: stats.averageAccuracy,
      bestAccuracy: stats.bestAccuracy,
      bestScaledScore: stats.bestScaledScore,
      favoriteWords,
      learningWords,
      masteredWords,
      recentAttempts: attempts.slice(0, 5),
      status,
      totalAttempts: stats.totalAttempts,
      totalQuestions: stats.totalQuestions,
      totalSeconds: stats.totalDurationSeconds,
      words
    };
  }, [data]);

  const maxActivity = Math.max(
    1,
    ...progress.activityDays.map((day) => day.total)
  );

  const showGuestPrompt = !isLoading && !isAuthenticated;
  const showLoading = (isLoading || !isLoaded) && !data;

  return (
    <section className="min-h-screen bg-[#f5f7f9] pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-shell py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-container text-primary">
                  <BarChart3 size={22} />
                </span>
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">
                    Tiến độ
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                    Tổng quan tiến độ học tập
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
                Nhìn lại số đề đã luyện, độ chính xác, thời gian học và vốn từ của bạn.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
              >
                <PlayCircle size={17} />
                Luyện đề
              </Link>
              <Link
                href="/vocabulary"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-primary shadow-soft transition hover:border-primary/35"
              >
                <BookOpenCheck size={17} />
                Sổ từ vựng
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showGuestPrompt ? (
        <GuestPrompt />
      ) : showLoading ? (
        <ProgressLoading />
      ) : (
      <div className="container-shell pt-7">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ListChecks}
            label="Lượt luyện"
            value={formatNumber(progress.totalAttempts)}
            helper={progress.totalAttempts > 0 ? "Lượt đã hoàn thành" : "Chưa có lượt nào"}
            tone="green"
          />
          <MetricCard
            icon={Target}
            label="Độ chính xác trung bình"
            value={
              progress.averageAccuracy === null
                ? "Chưa có"
                : `${progress.averageAccuracy}%`
            }
            helper={
              progress.bestAccuracy === null
                ? "Cần ít nhất một lượt luyện"
                : `Cao nhất ${progress.bestAccuracy}%`
            }
            tone="blue"
          />
          <MetricCard
            icon={BookOpenCheck}
            label="Từ vựng đã lưu"
            value={formatNumber(progress.words.length)}
            helper={`${progress.masteredWords} đã thuộc · ${progress.learningWords} đang học`}
            tone="amber"
          />
          <MetricCard
            icon={Timer}
            label="Thời gian luyện"
            value={formatDuration(progress.totalSeconds)}
            helper={`${progress.activeDays}/7 ngày có hoạt động`}
            tone="slate"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">
                  Hoạt động 7 ngày
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Số lượt luyện đề và từ vựng bạn ôn mỗi ngày.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-container/45 px-3 py-2 text-sm font-extrabold text-primary">
                <CalendarDays size={16} />
                {progress.activeDays} ngày hoạt động
              </span>
            </div>

            <div className="mt-6 grid h-64 grid-cols-7 items-end gap-3 border-b border-slate-200 pb-4">
              {progress.activityDays.map((day) => (
                <div
                  key={day.key}
                  className="flex h-full flex-col items-center justify-end gap-3"
                >
                  <div className="relative flex h-44 w-full items-end justify-center">
                    <span className="absolute bottom-0 h-full w-2 rounded-full bg-slate-100" />
                    <span
                      className={cn(
                        "relative w-5 rounded-t-full",
                        day.total > 0 ? "bg-primary" : "bg-slate-200"
                      )}
                      style={{
                        height: `${Math.max(8, Math.round((day.total / maxActivity) * 176))}px`
                      }}
                      title={`${day.total} hoạt động`}
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-extrabold text-ink">
                      {day.label}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-muted">
                      {day.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <MiniPanel
                icon={ListChecks}
                label="Số câu đã luyện"
                value={formatNumber(progress.totalQuestions)}
              />
              <MiniPanel
                icon={Trophy}
                label="Độ chính xác cao nhất"
                value={progress.bestAccuracy === null ? "Chưa có" : `${progress.bestAccuracy}%`}
              />
              <MiniPanel
                icon={Award}
                label="Điểm TOEIC cao nhất"
                value={
                  progress.bestScaledScore === null
                    ? "Chưa có"
                    : formatNumber(progress.bestScaledScore)
                }
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl bg-[#123f2a] p-5 text-white shadow-soft md:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/12 text-growth">
                  <Target size={21} />
                </span>
                <span className="rounded-lg bg-white/12 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-growth">
                  Trạng thái
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-extrabold">
                {progress.status.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/78">
                {progress.status.copy}
              </p>
              <div className="mt-6 grid gap-3">
                <StatusLine
                  label="Lượt luyện"
                  value={formatNumber(progress.totalAttempts)}
                />
                <StatusLine
                  label="Từ yêu thích"
                  value={formatNumber(progress.favoriteWords)}
                />
                <StatusLine
                  label="Từ đã thuộc"
                  value={formatNumber(progress.masteredWords)}
                />
              </div>
            </section>

            <ActionPanel
              hasAttempts={progress.totalAttempts > 0}
              learningWords={progress.learningWords}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">
                  Lịch sử gần đây
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Những lượt luyện gần đây nhất của bạn, mới nhất lên trước.
                </p>
              </div>
              <Link
                href="/practice"
                className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-primary"
              >
                Mở luyện đề
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {isLoaded && progress.recentAttempts.length > 0 ? (
                progress.recentAttempts.map((attempt) => (
                  <RecentAttemptRow key={attempt.id} attempt={attempt} />
                ))
              ) : (
                <EmptyState
                  icon={History}
                  title="Chưa có lịch sử luyện đề"
                  copy="Khi bạn hoàn thành một đề luyện, kết quả sẽ hiện ở đây."
                />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-ink">
                  Sổ từ vựng
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Tình trạng ghi nhớ từ vựng của bạn.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <BookOpenCheck size={19} />
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <VocabularyRatio
                label="Đã thuộc"
                value={progress.masteredWords}
                total={progress.words.length}
                color="bg-emerald-500"
              />
              <VocabularyRatio
                label="Đang học"
                value={progress.learningWords}
                total={progress.words.length}
                color="bg-amber-500"
              />
              <VocabularyRatio
                label="Yêu thích"
                value={progress.favoriteWords}
                total={progress.words.length}
                color="bg-blue-500"
              />
            </div>

            <Link
              href="/vocabulary"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 text-sm font-extrabold text-on-primary-container transition hover:bg-primary-fixed-dim"
            >
              Mở sổ từ vựng
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
      )}
    </section>
  );
}

function GuestPrompt() {
  return (
    <div className="container-shell pt-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft md:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-container text-primary">
          <LogIn size={26} />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-ink">
          Đăng nhập để xem tiến độ
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Tiến độ luyện đề và từ vựng được lưu theo tài khoản. Đăng nhập để theo
          dõi số liệu của riêng bạn.
        </p>
        <Link
          href="/login?next=/progress"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
        >
          <LogIn size={17} />
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

function ProgressLoading() {
  return (
    <div className="container-shell pt-7">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function MetricCard({
  helper,
  icon: Icon,
  label,
  tone,
  value
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: "green" | "blue" | "amber" | "slate";
  value: string;
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700"
  }[tone];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", toneClass)}>
          <Icon size={21} />
        </span>
      </div>
      <p className="mt-5 text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-muted">{helper}</p>
    </article>
  );
}

function MiniPanel({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{value}</p>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-bold text-white/72">{label}</span>
      <span className="font-extrabold text-growth">{value}</span>
    </div>
  );
}

function ActionPanel({
  hasAttempts,
  learningWords
}: {
  hasAttempts: boolean;
  learningWords: number;
}) {
  const action = !hasAttempts
    ? {
        copy: "Bắt đầu bằng một bài practice ngắn để có dữ liệu theo dõi.",
        href: "/practice",
        label: "Làm bài luyện",
        title: "Bước tiếp theo"
      }
    : learningWords > 0
      ? {
          copy: "Ôn nhóm từ đang học trước khi làm lượt practice kế tiếp.",
          href: "/vocabulary",
          label: "Ôn từ vựng",
          title: "Bước tiếp theo"
        }
      : {
          copy: "Làm thêm một lượt practice để kiểm tra độ ổn định.",
          href: "/practice",
          label: "Tiếp tục luyện",
          title: "Bước tiếp theo"
        };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:p-6">
      <h2 className="text-lg font-extrabold text-ink">{action.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{action.copy}</p>
      <Link
        href={action.href}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
      >
        {action.label}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function RecentAttemptRow({ attempt }: { attempt: PracticeAttempt }) {
  const accuracy = getAccuracy(attempt);

  return (
    <Link
      href={attempt.detailHref}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-primary/30 hover:shadow-soft md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
          <FileText size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-ink">
            {attempt.testTitle}
          </h3>
          <p className="mt-1 text-xs font-bold text-muted">
            {attempt.attemptedAt || "Chưa rõ ngày"} · {attempt.mode}
          </p>
          {attempt.scopeLabels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {attempt.scopeLabels.map((scope) => (
                <span
                  key={scope}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                >
                  {scope}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center md:w-[280px]">
        <AttemptStat label="Số câu đúng" value={`${attempt.correct}/${attempt.total}`} />
        <AttemptStat label="Độ chính xác" value={`${accuracy}%`} />
        <AttemptStat label="Thời gian" value={formatDuration(attempt.durationSeconds)} />
      </div>
    </Link>
  );
}

function AttemptStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="text-sm font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-muted">{label}</p>
    </div>
  );
}

function VocabularyRatio({
  color,
  label,
  total,
  value
}: {
  color: string;
  label: string;
  total: number;
  value: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm font-bold">
        <span className="text-muted">{label}</span>
        <span className="text-ink">
          {value}/{total}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className={cn("h-2 rounded-full", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  copy,
  icon: Icon,
  title
}: {
  copy: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{copy}</p>
    </div>
  );
}
