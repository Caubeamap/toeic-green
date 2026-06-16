"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, FileQuestion } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth";
import {
  getPracticeAttemptResult,
  type PracticeAttemptResult
} from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export default function AttemptResultPage() {
  const params = useParams<{ attemptId: string; testId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadResult() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextResult = await getPracticeAttemptResult(
          params.testId,
          params.attemptId
        );

        if (!cancelled) {
          setResult(nextResult);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, "Không tải được kết quả làm bài.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      loadResult();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, params.attemptId, params.testId]);

  const accuracy =
    result && result.attempt.total > 0
      ? Math.round((result.attempt.correct / result.attempt.total) * 100)
      : 0;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_36%)] pt-32">
        <section className="container-shell pb-16">
          {isLoading || isAuthLoading ? (
            <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
              Đang tải kết quả
            </div>
          ) : errorMessage || !result ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-soft">
              <h1 className="text-2xl font-extrabold text-red-700">
                Không tìm thấy kết quả
              </h1>
              <p className="mt-3 text-sm font-semibold text-red-700">
                {errorMessage ?? "Kết quả này không tồn tại hoặc không thuộc tài khoản hiện tại."}
              </p>
              <Link
                href="/practice"
                className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-primary/90"
              >
                Quay về danh sách
              </Link>
            </div>
          ) : (
            <>
              <Link
                href={`/practice/${result.test.id}/start`}
                className="mb-6 inline-flex text-sm font-bold text-primary transition hover:text-on-primary-container"
              >
                Quay lại trang chuẩn bị thi
              </Link>

              <div className="max-w-4xl rounded-[28px] border border-white/70 bg-white/68 p-6 shadow-glass backdrop-blur-xl sm:p-8">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-container/70 px-4 py-2 text-label-sm font-bold text-on-primary-container">
                  <CheckCircle2 className="h-4 w-4" />
                  Kết quả bài làm
                </div>
                <h1 className="text-headline-lg font-bold text-on-surface">
                  {result.test.title} {result.test.subtitle}
                </h1>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  Kết quả đã được lưu và có thể mở lại bất cứ lúc nào.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ResultMetric
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Ngày làm"
                    value={result.attempt.attemptedAt}
                  />
                  <ResultMetric
                    icon={<FileQuestion className="h-5 w-5" />}
                    label="Kết quả"
                    value={`${result.attempt.correct}/${result.attempt.total}`}
                  />
                  <ResultMetric
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Độ chính xác"
                    value={`${accuracy}%`}
                  />
                  <ResultMetric
                    icon={<Clock3 className="h-5 w-5" />}
                    label="Thời gian"
                    value={formatDuration(result.attempt.durationSeconds)}
                  />
                </div>

                {result.attempt.scaledScore ? (
                  <div className="mt-6 rounded-2xl border border-primary/20 bg-primary-container/20 p-5">
                    <p className="text-sm font-bold uppercase tracking-wider text-primary">
                      Scaled score
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-on-surface">
                      {result.attempt.scaledScore}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ResultMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-white/55 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-on-surface">{value}</p>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
