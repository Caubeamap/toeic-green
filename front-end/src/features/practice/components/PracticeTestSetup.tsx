"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Lightbulb,
  Lock,
  Play,
  ShieldCheck,
  Timer,
  Trophy,
  Users
} from "lucide-react";
import type { PracticeAttempt, PracticeTest } from "../lib/practice-tests";
import { mergePracticeProgress } from "../lib/practice-progress";
import { cn } from "@/lib/utils";

type TabId = "practice" | "full-test" | "discussion";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "practice", label: "Luyện tập" },
  { id: "full-test", label: "Làm full test" },
  { id: "discussion", label: "Thảo luận" }
];

export function PracticeTestSetup({ test }: { test: PracticeTest }) {
  const [activeTab, setActiveTab] = useState<TabId>("practice");
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(test.minutes);

  const currentTest = useMemo(() => mergePracticeProgress([test])[0], [test]);

  const timeOptions = useMemo(
    () => Array.from({ length: 28 }, (_, index) => index * 5),
    []
  );

  const selectedQuestions = useMemo(
    () =>
      currentTest.parts
        .filter((part) => selectedPartIds.includes(part.id))
        .reduce((total, part) => total + part.questions, 0),
    [selectedPartIds, currentTest.parts]
  );

  function togglePart(partId: string) {
    setSelectedPartIds((current) =>
      current.includes(partId)
        ? current.filter((id) => id !== partId)
        : [...current, partId]
    );
  }

  function selectAllParts() {
    setSelectedPartIds((current) =>
      current.length === currentTest.parts.length ? [] : currentTest.parts.map((part) => part.id)
    );
  }

  const pageTitle = `${currentTest.title} ${currentTest.subtitle}`;
  const { isAuthenticated } = useAuth();

  const queryParams = new URLSearchParams();
  if (selectedPartIds.length > 0) {
    queryParams.set("parts", selectedPartIds.join(","));
  }
  queryParams.set("time", String(timeLimit));

  const practiceHref = isAuthenticated
    ? `/practice/${currentTest.id}/test?${queryParams.toString()}`
    : `/login?next=${encodeURIComponent(`/practice/${currentTest.id}/start?${queryParams.toString()}`)}`;

  const fullTestHref = isAuthenticated
    ? `/practice/${currentTest.id}/test?mode=full`
    : `/login?next=${encodeURIComponent(`/practice/${currentTest.id}/start?mode=full`)}`;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_42%),radial-gradient(circle_at_100%_30%,#eef4ff_0%,#fbf9f8_38%)] pb-16 pt-12">
      <div className="container-shell">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-on-surface-variant">
          <Link className="transition hover:text-primary" href="/practice">
            Practice Tests
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">{currentTest.title}</span>
        </nav>

        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-container/80 px-4 py-2 text-label-sm font-bold text-on-primary-container">
              <ShieldCheck className="h-4 w-4" />
              Đề mô phỏng
            </div>
            <h1 className="max-w-3xl text-headline-lg font-bold text-on-surface md:text-[40px] md:leading-tight">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-body-md text-on-surface-variant">
              Chọn phần cần luyện hoặc vào full test để bắt đầu một lượt thi mô phỏng với cấu trúc giống đề TOEIC thật.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/60 bg-white/55 p-2 shadow-soft backdrop-blur-md">
            <StatChip icon={<Clock3 className="h-5 w-5" />} label={`${currentTest.minutes} phút`} />
            <StatChip icon={<FileQuestion className="h-5 w-5" />} label={`${currentTest.questions} câu`} />
            <StatChip icon={<Users className="h-5 w-5" />} label={`${currentTest.attempts.toLocaleString("en-US")} lượt`} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8">
            <RecentAttempts attempts={currentTest.recentAttempts ?? []} />

            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/62 shadow-glass backdrop-blur-xl">
              <div className="grid border-b border-outline-variant/60 bg-surface-container-low/70 p-1 sm:grid-cols-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "min-h-12 rounded-2xl px-4 text-label-md font-bold text-on-surface-variant transition hover:bg-white/55 hover:text-on-surface",
                      activeTab === tab.id && "bg-white text-primary shadow-sm"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-7">
                {activeTab === "practice" ? (
                  <PracticeTab
                    selectedPartIds={selectedPartIds}
                    selectedQuestions={selectedQuestions}
                    test={currentTest}
                    timeLimit={timeLimit}
                    timeOptions={timeOptions}
                    actionHref={practiceHref}
                    onSelectAll={selectAllParts}
                    onTimeLimitChange={setTimeLimit}
                    onTogglePart={togglePart}
                  />
                ) : null}

                {activeTab === "full-test" ? <FullTestTab actionHref={fullTestHref} test={currentTest} /> : null}

                {activeTab === "discussion" ? <DiscussionTab /> : null}
              </div>
            </div>
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/65 shadow-soft backdrop-blur-xl">
              <div className="relative h-48">
                <Image
                  src="/images/footer-study-visual.png"
                  alt="TOEIC Green study setup"
                  fill
                  priority
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Ghi chú</p>
                  <h2 className="mt-1 text-2xl font-extrabold">Mẹo làm bài TOEIC</h2>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Đọc trước câu hỏi Part 3-4 trước khi nghe audio.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Part 5: tập trung vào cấu trúc ngữ pháp trước khi xem nghĩa.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Part 7: đọc câu hỏi trước, quét bài đọc tìm keyword.</span></li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PracticeTab({
  selectedPartIds,
  selectedQuestions,
  test,
  timeLimit,
  timeOptions,
  actionHref,
  onSelectAll,
  onTimeLimitChange,
  onTogglePart
}: {
  selectedPartIds: string[];
  selectedQuestions: number;
  test: PracticeTest;
  timeLimit: number;
  timeOptions: number[];
  actionHref: string;
  onSelectAll: () => void;
  onTimeLimitChange: (value: number) => void;
  onTogglePart: (partId: string) => void;
}) {
  const allPartsSelected = selectedPartIds.length === test.parts.length;

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-primary/15 bg-primary-container/18 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Chọn phần luyện</h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              Chọn Part và đặt thời gian nếu cần.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Chọn phần luyện tập</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Đã chọn {selectedPartIds.length}/{test.parts.length} phần, {selectedQuestions} câu hỏi.
            </p>
          </div>
          <button
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
          >
            <CheckCircle2 className="h-4 w-4" />
            {allPartsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {test.parts.map((part) => {
            const selected = selectedPartIds.includes(part.id);

            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onTogglePart(part.id)}
                className={cn(
                  "flex min-h-[96px] items-start gap-4 rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-primary/40 bg-primary-container/20 shadow-soft"
                    : "border-outline-variant/70 bg-white/45 hover:border-primary/25 hover:bg-white/70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary text-white" : "border-outline-variant"
                  )}
                >
                  {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-on-surface">{part.label}</span>
                  <span className="mt-1 block text-sm text-on-surface-variant">{part.description}</span>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-primary">
                    {part.questions} câu hỏi
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-outline-variant/70 bg-white/45 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <label className="text-sm font-bold text-on-surface" htmlFor="time-limit">
            Giới hạn thời gian
          </label>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chọn 0 nếu muốn luyện từng phần không áp lực đồng hồ.
          </p>
        </div>
        <select
          id="time-limit"
          value={timeLimit}
          onChange={(event) => onTimeLimitChange(Number(event.target.value))}
          className="h-12 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option === 0 ? "Không giới hạn" : `${option} phút`}
            </option>
          ))}
        </select>
      </div>

      <Link
        href={selectedPartIds.length === 0 ? "#" : actionHref}
        aria-disabled={selectedPartIds.length === 0}
        className={cn(
          "inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-extrabold shadow-glow transition",
          selectedPartIds.length === 0
            ? "pointer-events-none cursor-not-allowed bg-surface-container-highest text-on-surface-variant"
            : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        <Play className="h-5 w-5" />
        Luyện tập
      </Link>
    </div>
  );
}

function RecentAttempts({ attempts }: { attempts: PracticeAttempt[] }) {
  if (attempts.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-[28px] border border-white/70 bg-white/68 p-5 shadow-glass backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-container/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-on-primary-container">
            <Trophy className="h-3.5 w-3.5" />
            Attempt history
          </div>
          <h2 className="text-xl font-bold text-on-surface">Kết quả 5 lần gần nhất</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            So sánh kết quả qua các lần làm bài.
          </p>
        </div>
        <Link
          href="/progress"
          className="inline-flex items-center justify-center rounded-xl border border-primary/30 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
        >
          Xem thống kê
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/70">
        <div className="hidden grid-cols-[1fr_1fr_1fr_120px] bg-surface-container-low px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-on-surface-variant md:grid">
          <span>Ngày làm</span>
          <span>Kết quả</span>
          <span>Thời gian</span>
          <span className="text-right">Chi tiết</span>
        </div>

        <div className="divide-y divide-outline-variant/70 bg-white/45">
          {attempts.slice(0, 5).map((attempt) => (
            <article
              key={attempt.id}
              className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_1fr_1fr_120px] md:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {attempt.attemptedAt}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-extrabold uppercase text-white",
                      attempt.mode === "Full test" ? "bg-green-600" : "bg-amber-600"
                    )}
                  >
                    {attempt.mode === "Full test" ? "Full test" : "Luyện tập"}
                  </span>
                  {(() => {
                    if (attempt.mode === "Full test") return null;
                    
                    const storedAttempt = attempt as { result?: { parts?: string[]; answers?: Record<string, string> } };
                    const resultObj = storedAttempt.result;
                    let labels: string[] = [];
                    
                    if (resultObj) {
                      if (resultObj.parts && resultObj.parts.length > 0) {
                        labels = resultObj.parts.map((p: string) => {
                          const num = p.replace("part-", "");
                          return `Part ${num}`;
                        });
                      } else if (resultObj.answers) {
                        labels = getPartsFromAnswers(resultObj.answers);
                      }
                    }
                    
                    if (labels.length === 0) {
                      labels = attempt.scopeLabels || [];
                    }
                    
                    labels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

                    return labels.map((label) => (
                      <span
                        key={`${attempt.id}-${label}`}
                        className="rounded-md bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 text-[10px] font-extrabold uppercase"
                      >
                        {label}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              <div>
                <p className="text-base font-extrabold text-on-surface">
                  {attempt.correct}/{attempt.total}
                  {attempt.scaledScore ? (
                    <span className="ml-1 text-sm font-bold text-primary">
                      (Điểm: {attempt.scaledScore})
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Độ chính xác {Math.round((attempt.correct / attempt.total) * 100)}%
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <Clock3 className="h-4 w-4 text-primary" />
                {formatDuration(attempt.durationSeconds)}
              </div>

              <Link
                href={attempt.detailHref}
                className="text-left text-sm font-bold text-primary transition hover:text-on-primary-container md:text-right"
              >
                Xem chi tiết
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FullTestTab({ actionHref, test }: { actionHref: string; test: PracticeTest }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="rounded-[28px] border border-primary/15 bg-primary-container/18 p-7">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
          <Timer className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface">
          Sẵn sàng cho bài thi {test.minutes} phút?
        </h2>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Full test sẽ khóa cấu trúc bài, tính giờ liên tục và lưu lại kết quả vào Test History sau khi nộp bài.
        </p>
        <Link
          href={actionHref}
          className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-base font-extrabold text-white shadow-glow transition-colors hover:bg-primary/90"
        >
          <Play className="h-5 w-5" />
          Bắt đầu thi
        </Link>
      </div>

      <div className="space-y-3">
        <ReadinessRow label="Lưu kết quả sau khi nộp bài" />
        <ReadinessRow label="Hiển thị bộ đếm giờ rõ ràng" />
        <ReadinessRow label="Giữ cấu trúc part đúng định dạng TOEIC" />
        <ReadinessRow label="Tổng kết điểm và câu sai sau khi nộp" />
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function DiscussionTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-outline-variant/70 bg-white/45 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Thảo luận</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tính năng thảo luận sắp ra mắt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/70 px-3 text-center text-primary">
      {icon}
      <span className="text-[11px] font-extrabold uppercase leading-tight text-on-surface">{label}</span>
    </div>
  );
}

function ReadinessRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/70 bg-white/45 p-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
      <span className="text-sm font-semibold text-on-surface">{label}</span>
    </div>
  );
}

function getPartsFromAnswers(answers: Record<string, string>): string[] {
  if (!answers) return [];
  const partIds = new Set<string>();
  
  Object.keys(answers).forEach((qId) => {
    const match = qId.match(/-q(\d+)$/i);
    if (match) {
      const qNum = parseInt(match[1], 10);
      if (qNum >= 1 && qNum <= 6) partIds.add("Part 1");
      else if (qNum >= 7 && qNum <= 31) partIds.add("Part 2");
      else if (qNum >= 32 && qNum <= 70) partIds.add("Part 3");
      else if (qNum >= 71 && qNum <= 100) partIds.add("Part 4");
      else if (qNum >= 101 && qNum <= 130) partIds.add("Part 5");
      else if (qNum >= 131 && qNum <= 146) partIds.add("Part 6");
      else if (qNum >= 147 && qNum <= 200) partIds.add("Part 7");
    }
  });
  
  return Array.from(partIds);
}
