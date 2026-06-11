import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, FileQuestion } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { allPracticeTests, getPracticeAttemptById } from "@/lib/practice-tests";

type AttemptResultPageProps = {
  params: Promise<{
    attemptId: string;
    testId: string;
  }>;
};

export function generateStaticParams() {
  return allPracticeTests.flatMap((test) =>
    (test.recentAttempts ?? []).map((attempt) => ({
      attemptId: attempt.id,
      testId: test.id
    }))
  );
}

export async function generateMetadata({ params }: AttemptResultPageProps): Promise<Metadata> {
  const { attemptId, testId } = await params;
  const result = getPracticeAttemptById(testId, attemptId);

  return {
    title: result
      ? `${result.test.title} ${result.test.subtitle} Result | TOEIC Green`
      : "Attempt Result | TOEIC Green"
  };
}

export default async function AttemptResultPage({ params }: AttemptResultPageProps) {
  const { attemptId, testId } = await params;
  const result = getPracticeAttemptById(testId, attemptId);

  if (!result) {
    notFound();
  }

  const { attempt, test } = result;
  const accuracy = Math.round((attempt.correct / attempt.total) * 100);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_36%)] pt-32">
        <section className="container-shell pb-16">
          <Link
            href={`/practice/${test.id}/start`}
            className="mb-6 inline-flex text-sm font-bold text-primary transition hover:text-on-primary-container"
          >
            Quay lại trang chuẩn bị thi
          </Link>

          <div className="max-w-4xl rounded-[28px] border border-white/70 bg-white/68 p-6 shadow-glass backdrop-blur-xl sm:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-container/70 px-4 py-2 text-label-sm font-bold text-on-primary-container">
              <CheckCircle2 className="h-4 w-4" />
              Attempt result
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface">
              {test.title} {test.subtitle}
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Đây là trang kết quả tóm tắt cho lần làm bài đã lưu. Khi có backend, dữ liệu chi tiết từng câu có thể được tải theo `attemptId`.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ResultMetric
                icon={<CalendarDays className="h-5 w-5" />}
                label="Ngày làm"
                value={attempt.attemptedAt}
              />
              <ResultMetric
                icon={<FileQuestion className="h-5 w-5" />}
                label="Kết quả"
                value={`${attempt.correct}/${attempt.total}`}
              />
              <ResultMetric
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="Độ chính xác"
                value={`${accuracy}%`}
              />
              <ResultMetric
                icon={<Clock3 className="h-5 w-5" />}
                label="Thời gian"
                value={formatDuration(attempt.durationSeconds)}
              />
            </div>

            {attempt.scaledScore ? (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary-container/20 p-5">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Scaled score</p>
                <p className="mt-1 text-3xl font-extrabold text-on-surface">{attempt.scaledScore}</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
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
