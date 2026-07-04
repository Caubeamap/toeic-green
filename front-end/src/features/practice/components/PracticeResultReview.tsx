"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useUrlState } from "@/lib/url-state";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Headphones,
  Loader2,
  Sparkles,
  XCircle
} from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { PracticeAttemptResult } from "@/features/practice";
import { formatQuestionStem } from "@/features/practice/lib/toeic-questions";
import {
  getNearbyQuestionImageUrls,
  getNextAudioUrls,
  preloadImageUrls
} from "@/features/practice/lib/media-preload";
import { formatPracticeTestTitle } from "@/features/practice/lib/practice-tests";
import {
  extractQuotesFromExplanation,
  getSmartExplanation,
  highlightHtmlTextSafe,
  splitTranscript
} from "@/features/practice/lib/result-explanations";
import {
  calculateScore,
  getPartsFromAnswers
} from "@/features/practice/lib/result-scoring";
import { cn } from "@/lib/utils";
import { ResultMetricCard } from "./ResultMetricCard";
import { ResultNavItem } from "./ResultNavItem";
import { ReviewQuestionCard } from "./ReviewQuestionCard";

export function PracticeResultReview({
  attemptResult,
}: {
  attemptResult: PracticeAttemptResult;
}) {
  const router = useRouter();
  const { searchParams, setParams } = useUrlState();
  const result = attemptResult.result;
  const test = attemptResult.test;
  const questions = attemptResult.questions;
  const displayTestTitle = useMemo(() => formatPracticeTestTitle(test), [test]);
  const [activePassageTab, setActivePassageTab] = useState(0);
  const [prevGroupId, setPrevGroupId] = useState<string | undefined>(undefined);
  const [showTranscriptMap, setShowTranscriptMap] = useState<Record<string, boolean>>({});
  const [showExplanationMap, setShowExplanationMap] = useState<Record<string, boolean>>({});
  const [leftPanelLang, setLeftPanelLang] = useState<"en" | "vi">("en");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [trackedImageUrl, setTrackedImageUrl] = useState<string | null | undefined>(
    undefined
  );

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  // Mobile (<lg): cả khối review là MỘT cột cuộn theo trang nên ref này dùng để
  // đưa media câu mới lên đầu khi đổi câu (desktop vẫn cuộn riêng panel phải).
  const reviewPanelRef = useRef<HTMLDivElement>(null);
  const preloadedAudioRef = useRef<HTMLAudioElement[]>([]);

  // Derive active parts and active questions from the submitted attempt.
  const activeParts = useMemo(() => {
    if (result.parts && result.parts.length > 0) return result.parts;
    return getPartsFromAnswers(result.answers);
  }, [result]);

  const isFullTest = useMemo(() => {
    return result.total >= 200 || activeParts.length === 7;
  }, [result, activeParts]);

  const activeQuestions = useMemo(() => {
    if (isFullTest || activeParts.length === 0) {
      return questions;
    }
    return questions.filter((q) => activeParts.includes(q.partId));
  }, [questions, activeParts, isFullTest]);

  const activeListeningQuestions = useMemo(() => {
    return activeQuestions.filter((q) => ["part-1", "part-2", "part-3", "part-4"].includes(q.partId));
  }, [activeQuestions]);

  const activeReadingQuestions = useMemo(() => {
    return activeQuestions.filter((q) => ["part-5", "part-6", "part-7"].includes(q.partId));
  }, [activeQuestions]);

  // Compute stats
  const stats = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    return calculateScore(activeQuestions, result.answers);
  }, [result, activeQuestions]);

  // Selected review question — câu đang xem lấy từ URL (?question=, 1-based),
  // kẹp trong [1, totalQuestions] để link sai/quá giới hạn vẫn an toàn.
  const totalQuestions = activeQuestions.length;
  const reviewIndex = Math.min(
    Math.max(
      (Number.parseInt(searchParams.get("question") ?? "1", 10) || 1) - 1,
      0
    ),
    Math.max(totalQuestions - 1, 0)
  );
  const currentQuestion = activeQuestions[reviewIndex];
  const hasReviewContextPanel = currentQuestion?.partId !== "part-5";

  // Reset cờ loading ảnh ĐỒNG BỘ trong render khi đổi câu (pattern tracked-url),
  // không dùng setTimeout/effect: ảnh đã preload nên onLoad bắn trước khi effect
  // chạy → reset trễ lật cờ về true vĩnh viễn (spinner kẹt). Xem lessons.md.
  if (trackedImageUrl !== currentQuestion?.image_url) {
    setTrackedImageUrl(currentQuestion?.image_url);
    setImageLoading(Boolean(currentQuestion?.image_url));
  }

  // Resolve audio URL for the current active question/group
  const currentQuestionAudioUrl = useMemo(() => {
    if (!currentQuestion) return null;
    if (currentQuestion.audio_url) return currentQuestion.audio_url;
    if (currentQuestion.passageGroupId) {
      const groupFirst = activeQuestions.find(
        (q) => q.passageGroupId === currentQuestion.passageGroupId && q.audio_url
      );
      return groupFirst?.audio_url || null;
    }
    return null;
  }, [currentQuestion, activeQuestions]);

  // Track prevGroupId for render-phase resets
  if (currentQuestion?.passageGroupId !== prevGroupId) {
    setPrevGroupId(currentQuestion?.passageGroupId);
    setActivePassageTab(0);
    setLeftPanelLang("en");
  }
  // Set of flagged question IDs
  const flagsSet = useMemo(() => {
    return new Set(result.flaggedIds || []);
  }, [result.flaggedIds]);
  // Group questions by passageGroupId to render details on review.
  // For Part 1, 2, 5, return all questions in that part to show them as a scrollable list.
  const currentGroupQuestions = useMemo(() => {
    if (!currentQuestion) return [];
    if (
      currentQuestion.partId === "part-1" ||
      currentQuestion.partId === "part-2" ||
      currentQuestion.partId === "part-5"
    ) {
      return activeQuestions.filter((q) => q.partId === currentQuestion.partId);
    }
    if (currentQuestion.passageGroupId) {
      return activeQuestions.filter((q) => q.passageGroupId === currentQuestion.passageGroupId);
    }
    return [currentQuestion];
  }, [currentQuestion, activeQuestions]);

  // Split multi-passages string by "--- Passage X: Title ---" (review view)
  const passagesList = useMemo(() => {
    if (!currentQuestion?.passage) return [];
    const text = currentQuestion.passage;
    const regex = /---\s*Passage\s*(\d+):\s*([^-]+)\s*---/g;
    const matches = [...text.matchAll(regex)];

    const smartExplanation = getSmartExplanation(currentQuestion, text);
    const quotes = extractQuotesFromExplanation(smartExplanation);

    const highlightText = (content: string) => {
      let result = content;
      for (const q of quotes) {
        result = highlightHtmlTextSafe(result, q);
      }
      return result;
    };

    if (matches.length === 0) {
      return [{ title: "Văn bản đọc", content: highlightText(text) }];
    }

    const list: { title: string; content: string }[] = [];
    const splits = text.split(/---\s*Passage\s*\d+:[^-]+---/g);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const index = i + 1;
      list.push({
        title: `Đoạn ${match[1]}: ${match[2].trim()}`,
        content: highlightText((splits[index] || "").trim()),
      });
    }
    return list;
  }, [currentQuestion]);

  const scrollToReviewCard = useCallback((questionNumber: number) => {
    requestAnimationFrame(() => {
      // Mobile (<lg): trang là một cột cuộn → đưa khối review về đầu để hiện
      // media câu mới trước, rồi cuộn xuống xem đáp án/giải thích (giống màn thi).
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        reviewPanelRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      const container = rightPanelRef.current;
      const element = document.getElementById(`review-card-${questionNumber}`);

      if (!container || !element) {
        return;
      }

      const targetTop =
        element.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        element.clientHeight / 2;

      // Cuộn tức thì (auto) thay vì smooth: cuộn smooth lập trình chạy trên main
      // thread trải qua nhiều frame → gây rớt frame khi đổi câu. Snap tức thì khi
      // duyệt câu mượt hơn và là UX hợp lý cho trang xem lại.
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "auto"
      });
    });
  }, []);

  // Navigation handlers
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      // native: đổi URL qua window.history (không refetch RSC) → duyệt câu mượt,
      // không giật; URL vẫn bookmark + back/forward được.
      setParams({ question: index === 0 ? null : index + 1 }, { native: true });
      scrollToReviewCard(activeQuestions[index].questionNumber);
    }
  }, [activeQuestions, scrollToReviewCard, setParams, totalQuestions]);

  // Map id→index dựng sẵn (O(n)) thay cho indexOf trong vòng lặp (O(n²)=40k với 200 câu).
  const navIndexById = useMemo(() => {
    const map = new Map<string, number>();
    activeQuestions.forEach((q, i) => map.set(q.id, i));
    return map;
  }, [activeQuestions]);

  const handleNavTo = useCallback(
    (index: number) => {
      goTo(index);
      setIsNavOpen(false);
    },
    [goTo]
  );

  // Handler ổn định cho ReviewQuestionCard memo (giữ tham chiếu để memo bỏ qua).
  const handleSelectCard = useCallback(
    (id: string) => {
      const idx = navIndexById.get(id);
      if (idx !== undefined) goTo(idx);
    },
    [navIndexById, goTo]
  );
  const handleToggleTranscript = useCallback((id: string) => {
    setShowTranscriptMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const handleToggleExplanation = useCallback((id: string) => {
    setShowExplanationMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const canGoPrevious = reviewIndex > 0;
  const canGoNext = reviewIndex < totalQuestions - 1;
  const reviewPositionLabel = totalQuestions > 0 ? `${reviewIndex + 1}/${totalQuestions}` : "0/0";

  const goPreviousQuestion = useCallback(() => {
    if (canGoPrevious) {
      goTo(reviewIndex - 1);
    }
  }, [canGoPrevious, goTo, reviewIndex]);

  const goNextQuestion = useCallback(() => {
    if (canGoNext) {
      goTo(reviewIndex + 1);
    }
  }, [canGoNext, goTo, reviewIndex]);

  // Preload only images near the active review question.
  useEffect(() => {
    preloadImageUrls(getNearbyQuestionImageUrls(activeQuestions, reviewIndex, 2));
  }, [activeQuestions, reviewIndex]);

  // Find all unique audio URLs for the Listening section in order
  const uniqueAudioUrls = useMemo(() => {
    if (!activeQuestions || activeQuestions.length === 0) return [];
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const q of activeQuestions) {
      if (["part-1", "part-2", "part-3", "part-4"].includes(q.partId) && q.audio_url) {
        if (!seen.has(q.audio_url)) {
          seen.add(q.audio_url);
          urls.push(q.audio_url);
        }
      }
    }
    return urls;
  }, [activeQuestions]);

  const currentTrackIndex = useMemo(() => {
    if (!currentQuestionAudioUrl) return -1;
    return uniqueAudioUrls.indexOf(currentQuestionAudioUrl);
  }, [currentQuestionAudioUrl, uniqueAudioUrls]);

  // Preload a small audio window ahead and keep references alive.
  useEffect(() => {
    preloadedAudioRef.current = getNextAudioUrls(
      uniqueAudioUrls,
      currentTrackIndex,
      3
    ).map((url) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      return audio;
    });
  }, [currentTrackIndex, uniqueAudioUrls]);

  // Format display helper
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  }

  // Blank parser for Part 6 in Review with safe HTML & clicking support
  const getPart6HtmlReview = (text: string) => {
    if (!text) return "";
    return text.replace(/_{2,}\((\d+)\)/g, (match, qNumStr) => {
      const qNum = parseInt(qNumStr, 10);
      const correspondingQ = activeQuestions.find((q) => q.questionNumber === qNum);
      if (!correspondingQ) return match;

      return `<span class="part6-blank">______(${qNum})</span>`;
    });
  };

  if (questions.length === 0 || !stats) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-background pt-32 grid place-items-center">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white/86 p-10 text-center shadow-glass">
            <h1 className="text-xl font-black text-ink">Không tìm thấy kết quả</h1>
            <p className="mt-3 text-xs text-muted">
              Có vẻ bạn chưa làm bài thi này trong phiên làm việc hiện tại hoặc dữ liệu thi đã bị xóa.
            </p>
            <button
              type="button"
              onClick={() => router.push("/practice")}
              className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-glow transition hover:bg-primary/95"
            >
              Quay lại danh sách bài thi
            </button>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // Calculate section scores
  const scorePercent = Math.round((result.correct / result.total) * 100);
  const hasToeicTotalScore = stats.totalScore !== null;
  const mainScoreValue = hasToeicTotalScore
    ? String(stats.totalScore)
    : `${result.correct}/${result.total}`;
  const mainScoreLabel = hasToeicTotalScore
    ? "Điểm TOEIC ước tính"
    : "Câu đúng";
  const scoreDescription = hasToeicTotalScore
    ? "Bài làm đã được lưu lại. Xem lại từng câu, nghe lại audio và đọc phần giải thích để biết mình cần cải thiện ở đâu."
    : "Bài làm đã được lưu lại. Kéo xuống để xem lại đáp án, nghe lại audio và ghi chú những phần cần luyện thêm.";

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_50%),radial-gradient(circle_at_100%_100%,#eef4ff_0%,#fbf9f8_50%)] pt-24 pb-16">
        
        {/* SECTION 1: SCOREBOARD BRIEFING */}
        <section className="container-shell mb-10">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => router.push(`/practice/${test.id}/start`)}
              className="inline-flex text-xs font-black text-primary transition hover:text-on-primary-container"
            >
              ← Quay lại trang chi tiết bài thi
            </button>
          </div>

          <div className="rounded-3xl border border-white bg-white/86 p-6 shadow-glass">
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
              
              {/* Circular Gauge Score */}
              <div className="flex flex-col items-center justify-center text-center p-4 border-r border-outline-variant/20 lg:pr-8">
                <div
                  className="relative grid aspect-square w-44 place-items-center rounded-full shadow-soft"
                  style={{
                    background: `conic-gradient(#006e19 0% ${scorePercent}%, #edf1ed ${scorePercent}% 100%)`,
                  }}
                >
                  <div className="grid h-[85%] w-[85%] place-items-center rounded-full bg-white text-center">
                    <div>
                      <p className="text-4xl font-black tracking-tight text-primary">{mainScoreValue}</p>
                      <p className="text-[10px] font-black uppercase text-muted tracking-wider mt-0.5">{mainScoreLabel}</p>
                    </div>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-black text-ink uppercase">
                  {isFullTest ? "KẾT QUẢ THI FULL TEST" : "KẾT QUẢ LUYỆN TẬP"}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 justify-center">
                  <span className="text-xs text-muted font-bold">{displayTestTitle}</span>
                  {!isFullTest && activeParts.map((p) => {
                    const num = p.replace("part-", "");
                    return (
                      <span key={p} className="rounded bg-amber-100 text-amber-850 border border-amber-200 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                        Part {num}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-4 w-4" />
                    </span>
                    <h2 className="text-xl font-black text-ink">Kết quả làm bài</h2>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed font-medium">
                    {scoreDescription}
                  </p>
                </div>

                {/* Score stats */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ResultMetricCard
                    icon={<Headphones className="h-4 w-4" />}
                    title="Nghe"
                    value={stats.lcTotal > 0 ? `${stats.lcCorrect}/${stats.lcTotal} câu` : "Không chọn"}
                    subValue={
                      stats.lcScaled !== null
                        ? `~ ${stats.lcScaled} điểm`
                        : stats.lcTotal > 0
                        ? "Chưa đủ 100 câu"
                        : "Không có dữ liệu"
                    }
                    tone="green"
                  />
                  <ResultMetricCard
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Đọc"
                    value={stats.rcTotal > 0 ? `${stats.rcCorrect}/${stats.rcTotal} câu` : "Không chọn"}
                    subValue={
                      stats.rcScaled !== null
                        ? `~ ${stats.rcScaled} điểm`
                        : stats.rcTotal > 0
                        ? "Chưa đủ 100 câu"
                        : "Không có dữ liệu"
                    }
                    tone="blue"
                  />
                  <ResultMetricCard
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title="Độ chính xác"
                    value={`${scorePercent}%`}
                    subValue={`${result.correct}/${result.total} đúng`}
                    tone="emerald"
                  />
                  <ResultMetricCard
                    icon={<Clock className="h-4 w-4" />}
                    title="Thời gian làm"
                    value={formatTime(result.duration)}
                    subValue={
                      result.timeLimit !== undefined
                        ? (result.timeLimit === 0 ? "Không giới hạn" : `Hạn ${result.timeLimit} phút`)
                        : (isFullTest ? "Hạn 120 phút" : "Không giới hạn")
                    }
                    tone="purple"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE REVIEW & LEARNING VIEW */}
        <section className="container-shell">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Xem lại đáp án & Giải thích chi tiết</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-2xl border border-outline-variant/40 bg-white/80 p-1 shadow-soft">
                <button
                  type="button"
                  onClick={goPreviousQuestion}
                  disabled={!canGoPrevious}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-ink transition-colors hover:bg-primary-container/45 disabled:cursor-not-allowed disabled:text-muted/45 disabled:hover:bg-transparent"
                  title="Câu trước"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Câu trước</span>
                </button>
                <span className="hidden h-5 w-px bg-outline-variant/50 sm:block" />
                <span className="min-w-16 px-2 text-center text-[11px] font-black text-muted">
                  {reviewPositionLabel}
                </span>
                <span className="hidden h-5 w-px bg-outline-variant/50 sm:block" />
                <button
                  type="button"
                  onClick={goNextQuestion}
                  disabled={!canGoNext}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-ink transition-colors hover:bg-primary-container/45 disabled:cursor-not-allowed disabled:text-muted/45 disabled:hover:bg-transparent"
                  title="Câu tiếp"
                >
                  <span>Câu tiếp</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="flex h-11 items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container hover:bg-primary-container/80 transition-all shadow-glass backdrop-blur-md"
                title="Mở điều hướng câu hỏi"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Điều hướng</span>
              </button>
            </div>
          </div>

          <div className="relative grid grid-cols-1 gap-6 items-start">
            
            {/* Container 1: Review Panel (Passage + Question Card)
                Mobile (<lg): cao tự nhiên, cuộn theo trang (một cột).
                lg+: khung cố định chiều cao, hai cột scroll riêng (giữ tối ưu jank). */}
            <div
              ref={reviewPanelRef}
              className="relative flex flex-1 overflow-visible rounded-3xl border border-white bg-white/86 shadow-glass lg:h-[min(82vh,860px)] lg:min-h-[680px] lg:overflow-hidden [contain:layout_paint] [transform:translateZ(0)]"
            >

            {/* 2-Column Split Review Panels */}
            <div
              className={cn(
                "flex flex-1 min-w-0 overflow-visible lg:h-full lg:overflow-hidden",
                hasReviewContextPanel ? "flex-col lg:flex-row" : "flex-col"
              )}
            >
              
              {/* Review Left Column (Passage / Media / Photos) */}
              <div
                ref={leftPanelRef}
                className={cn(
                  "flex w-full min-w-0 flex-col justify-start border-b border-outline-variant/20 bg-surface-container-low p-4 md:p-6",
                  "lg:h-full lg:flex-none lg:overflow-y-auto lg:border-b-0 lg:border-r lg:w-[60%] xl:w-[62%] 2xl:w-[64%]",
                  "overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)]",
                  currentQuestion.partId === "part-5" && "hidden"
                )}
              >
                {/* Audio Player for Listening sections */}
                {currentQuestionAudioUrl && (
                  <audio
                    key={currentQuestionAudioUrl} // force player reset on track change
                    src={currentQuestionAudioUrl}
                    controls
                    className="w-full h-8 mb-4 focus:outline-none shrink-0"
                  />
                )}

                {/* Part 1: Photograph */}
                {currentQuestion.partId === "part-1" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black uppercase text-primary">Ảnh mô tả Q{currentQuestion.questionNumber}</span>
                    <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-soft max-h-[480px] relative">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                        </div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={currentQuestion.image_url ?? "no-image"}
                        ref={(node) => {
                          // Ảnh đã cache có thể bắn 'load' trước khi React gắn
                          // onLoad → kiểm tra complete ngay khi mount để gỡ spinner.
                          if (node && node.complete && node.naturalWidth > 0) {
                            setImageLoading(false);
                          }
                        }}
                        src={currentQuestion.image_url ?? undefined}
                        alt="Question Visual"
                        decoding="async"
                        loading="eager"
                        fetchPriority="high"
                        className={cn(
                          "w-full h-[380px] object-contain bg-zinc-50 transition-opacity duration-150",
                          imageLoading ? "opacity-0" : "opacity-100"
                        )}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Part 2: Headphone Graphic with Question Transcript */}
                {currentQuestion.partId === "part-2" && (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-ink">Lời thoại câu hỏi ngắn</h4>
                        <p className="text-[10px] text-muted">Part 2 Audio transcript</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-soft">
                      <p className="text-xs font-black text-primary uppercase">Question:</p>
                      <p className="mt-1 text-sm font-bold text-ink italic">&ldquo;{formatQuestionStem(currentQuestion.stem)}&rdquo;</p>
                    </div>
                  </div>
                )}

                {/* Part 3 & 4: Audio Transcript Dialogues */}
                {(currentQuestion.partId === "part-3" || currentQuestion.partId === "part-4") && (() => {
                  const { english, vietnamese } = splitTranscript(currentQuestion.transcript);
                  const displayEn = currentQuestion.passage || english;
                  // Câu chỉ có graphic (vd Part 4 "Look at the graphic") không có lời
                  // thoại → ẩn toàn bộ khối transcript để không hiện khung trắng rỗng.
                  const hasTranscript = Boolean(displayEn) || Boolean(vietnamese);
                  const activeContent = leftPanelLang === "en" ? displayEn : vietnamese;

                  return (
                    <div className="space-y-4">
                      {hasTranscript && (
                      <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Headphones className="h-4 w-4 text-primary" />
                            <span>Audio Transcript</span>
                          </h4>
                          <span className="text-[9px] bg-primary/10 px-2 py-0.5 rounded text-primary font-bold">
                            Part {currentQuestion.partId === "part-3" ? 3 : 4}
                          </span>
                        </div>
                        
                        {/* Language Switcher Tabs */}
                        <div className="flex gap-1 bg-surface-container-highest/40 p-0.5 rounded-lg w-fit">
                          <button
                            key="en"
                            type="button"
                            onClick={() => setLeftPanelLang("en")}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                              leftPanelLang === "en"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            English
                          </button>
                          {vietnamese && (
                            <button
                              key="vi"
                              type="button"
                              onClick={() => setLeftPanelLang("vi")}
                              className={cn(
                                "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                                leftPanelLang === "vi"
                                  ? "bg-white text-primary shadow-sm"
                                  : "text-muted hover:text-ink"
                              )}
                            >
                              Tiếng Việt
                            </button>
                          )}
                        </div>
                      </div>
                      )}

                      {activeContent && (
                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft lg:max-h-[300px] lg:overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] text-xs leading-relaxed text-ink font-semibold whitespace-pre-line transition-colors duration-150">
                        {leftPanelLang === "en" ? (
                          <div dangerouslySetInnerHTML={{
                            __html: (() => {
                              const smartExplanation = getSmartExplanation(currentQuestion, displayEn);
                              const quotes = extractQuotesFromExplanation(smartExplanation);
                              let html = displayEn;
                              for (const q of quotes) {
                                html = highlightHtmlTextSafe(html, q);
                              }
                              return html;
                            })()
                          }} />
                        ) : (
                          <div className="text-muted">{vietnamese}</div>
                        )}
                      </div>
                      )}

                      {currentQuestion.image_url && (
                        <div className="space-y-4">
                          {currentQuestion.image_url.split(',').map((url, idx) => (
                            <div key={url} className="overflow-hidden rounded-2xl border border-white bg-white shadow-soft max-h-[220px]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Attached visual ${idx + 1}`}
                                decoding="async"
                                loading={idx === 0 ? "eager" : "lazy"}
                                fetchPriority={idx === 0 ? "high" : "auto"}
                                className="w-full h-[180px] object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Part 6: Passage with Blanks */}
                {currentQuestion.partId === "part-6" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="text-xs font-black text-ink uppercase">Bài đọc điền ô trống</h4>
                      
                      {/* Language Switcher Tabs */}
                      {currentQuestion.transcript && (
                        <div className="flex gap-1 bg-surface-container-highest/40 p-0.5 rounded-lg w-fit">
                          <button
                            key="en"
                            type="button"
                            onClick={() => setLeftPanelLang("en")}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                              leftPanelLang === "en"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            English
                          </button>
                          <button
                            key="vi"
                            type="button"
                            onClick={() => setLeftPanelLang("vi")}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                              leftPanelLang === "vi"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            Tiếng Việt
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft lg:max-h-[600px] xl:max-h-[700px] lg:overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] leading-relaxed"
                    >
                      {leftPanelLang === "en" ? (
                        currentQuestion.image_url ? (
                          <div className="space-y-4">
                            {currentQuestion.image_url.split(',').map((url, idx) => (
                              <div key={url} className="relative group rounded-xl overflow-hidden border border-outline-variant/20 bg-white/40">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Part 6 passage image ${idx + 1}`}
                                  decoding="async"
                                  loading={idx === 0 ? "eager" : "lazy"}
                                  fetchPriority={idx === 0 ? "high" : "auto"}
                                  className="w-full h-auto object-contain max-h-[500px] lg:max-h-[600px]"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="part6-passage passage-content text-sm font-medium text-ink"
                            dangerouslySetInnerHTML={{ 
                              __html: getPart6HtmlReview(currentQuestion.passage || "")
                            }}
                          />
                        )
                      ) : (
                        <div className="text-sm font-medium text-muted whitespace-pre-line leading-relaxed">
                          {currentQuestion.transcript}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Part 7: Passages */}
                {currentQuestion.partId === "part-7" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="text-xs font-black text-ink uppercase">Văn bản đọc</h4>
                      
                      {/* Language Switcher Tabs */}
                      {currentQuestion.transcript && (
                        <div className="flex gap-1 bg-surface-container-highest/40 p-0.5 rounded-lg w-fit">
                          <button
                            key="en"
                            type="button"
                            onClick={() => setLeftPanelLang("en")}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                              leftPanelLang === "en"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            English (Gốc)
                          </button>
                          <button
                            key="vi"
                            type="button"
                            onClick={() => setLeftPanelLang("vi")}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition-colors",
                              leftPanelLang === "vi"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            Tiếng Việt (Dịch)
                          </button>
                        </div>
                      )}
                    </div>

                    {leftPanelLang === "en" ? (
                      <div className="space-y-4">
                        {passagesList.length > 1 && (
                          <div className="flex gap-2 border-b border-outline-variant/20 pb-1.5 overflow-x-auto scrollbar-none">
                            {passagesList.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActivePassageTab(idx)}
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-[10px] font-black transition-colors whitespace-nowrap",
                                  activePassageTab === idx
                                    ? "bg-primary text-white shadow-glow"
                                    : "border border-outline-variant/40 bg-white/60 text-muted"
                                )}
                              >
                                {p.title}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft lg:max-h-[600px] xl:max-h-[700px] lg:overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)]">
                          {passagesList.length > 0 ? (
                            <div 
                              className="text-sm leading-relaxed text-ink font-medium passage-content"
                              dangerouslySetInnerHTML={{ __html: passagesList[activePassageTab]?.content || "" }}
                            />
                          ) : currentQuestion.image_url ? (
                            <div className="space-y-4">
                              {currentQuestion.image_url.split(',').map((url, idx) => (
                                <div key={url} className="relative group rounded-xl overflow-hidden border border-outline-variant/20 bg-white/40">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`Part 7 passage image ${idx + 1}`}
                                    decoding="async"
                                    loading={idx === 0 ? "eager" : "lazy"}
                                    fetchPriority={idx === 0 ? "high" : "auto"}
                                    className="w-full h-auto object-contain max-h-[500px] lg:max-h-[600px]"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft lg:max-h-[600px] xl:max-h-[700px] lg:overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] whitespace-pre-line text-sm text-muted font-medium leading-relaxed">
                        {currentQuestion.transcript}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Review Right Column (Question Card) */}
              <main
                ref={rightPanelRef}
                className={cn(
                  "min-w-0 overscroll-contain p-4 xl:p-5 lg:overflow-y-auto [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)]",
                  hasReviewContextPanel
                    ? "w-full lg:flex-none lg:w-[40%] xl:w-[38%] 2xl:w-[36%]"
                    : "w-full flex-1"
                )}
              >
                <div className="max-w-3xl mx-auto space-y-6 pb-8">

                  {currentGroupQuestions.map((q) => {
                    const selected = result.answers[q.id];
                    return (
                      <ReviewQuestionCard
                        key={q.id}
                        q={q}
                        isCurrent={q.id === currentQuestion.id}
                        selected={selected}
                        isCorrect={selected === q.correctAnswer}
                        isMarked={flagsSet.has(q.id)}
                        isTranscriptOpen={!!showTranscriptMap[q.id]}
                        isExplanationOpen={!!showExplanationMap[q.id]}
                        onSelect={handleSelectCard}
                        onToggleTranscript={handleToggleTranscript}
                        onToggleExplanation={handleToggleExplanation}
                      />
                    );
                  })}


                </div>
              </main>

            </div>
            
            </div> {/* Container 1 End */}

            {/* Sidebar Jump Board on Review */}
            {typeof window !== "undefined" && isNavOpen && createPortal(
              <div
                className="fixed inset-0 z-50 flex justify-end bg-transparent p-3 sm:p-5"
                role="presentation"
                onClick={() => setIsNavOpen(false)}
              >
                <aside
                  className="review-nav-drawer w-full max-w-[360px] border border-primary/15 bg-[#f8fff7]/95 rounded-3xl flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-hidden shadow-[0_20px_60px_rgba(17,24,23,0.14)] ring-1 ring-white/80"
                  role="dialog"
                  aria-modal="false"
                  aria-label="Điều hướng câu hỏi"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-b border-primary/10 bg-gradient-to-br from-primary-container/55 via-white/88 to-white/70 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
                          <Flag className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-ink">Điều hướng câu hỏi</h3>
                          <p className="text-[10px] font-semibold text-muted mt-0.5">
                            Đang xem {reviewPositionLabel} · Câu {currentQuestion?.questionNumber ?? "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNavOpen(false)}
                      className="rounded-xl p-2 text-muted hover:bg-white/80 hover:text-ink transition-colors"
                      title="Thu nhỏ điều hướng"
                      aria-label="Đóng điều hướng câu hỏi"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Grid with correct/incorrect coloring */}
                  <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 [scrollbar-gutter:stable] [will-change:scroll-position]">
                    
                    {/* Listening List */}
                    {activeListeningQuestions.length > 0 && (
                      <div className="rounded-2xl border border-primary/10 bg-white/75 p-3 shadow-soft space-y-2">
                        <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                          <span className="text-[10px] font-black uppercase text-primary">Listening</span>
                          <span className="text-[9px] font-bold text-muted">
                            {activeListeningQuestions[0].questionNumber}-{activeListeningQuestions[activeListeningQuestions.length - 1].questionNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                          {activeListeningQuestions.map((q) => {
                            const idx = navIndexById.get(q.id) ?? 0;
                            const selected = result.answers[q.id];
                            const status = selected
                              ? selected === q.correctAnswer
                                ? "correct"
                                : "wrong"
                              : "none";
                            return (
                              <ResultNavItem
                                key={q.id}
                                questionNumber={q.questionNumber}
                                index={idx}
                                isSelected={idx === reviewIndex}
                                status={status}
                                onGoTo={handleNavTo}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reading List */}
                    {activeReadingQuestions.length > 0 && (
                      <div className="rounded-2xl border border-secondary/10 bg-white/75 p-3 shadow-soft space-y-2">
                        <div className="flex justify-between items-center border-b border-secondary/10 pb-2">
                          <span className="text-[10px] font-black uppercase text-secondary">Reading</span>
                          <span className="text-[9px] font-bold text-muted">
                            {activeReadingQuestions[0].questionNumber}-{activeReadingQuestions[activeReadingQuestions.length - 1].questionNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                          {activeReadingQuestions.map((q) => {
                            const idx = navIndexById.get(q.id) ?? 0;
                            const selected = result.answers[q.id];
                            const status = selected
                              ? selected === q.correctAnswer
                                ? "correct"
                                : "wrong"
                              : "none";
                            return (
                              <ResultNavItem
                                key={q.id}
                                questionNumber={q.questionNumber}
                                index={idx}
                                isSelected={idx === reviewIndex}
                                status={status}
                                onGoTo={handleNavTo}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Sidebar Legend for Review */}
                  <div className="border-t border-primary/10 p-4 bg-white/65 grid grid-cols-3 gap-2 text-[9px] font-black text-muted shrink-0">
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-green-50 px-2 py-2 text-green-700">
                      <span className="h-2 w-2 rounded bg-green-600" />
                      <span>Đúng ({result.correct})</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-2 py-2 text-red-700">
                      <span className="h-2 w-2 rounded bg-red-500" />
                      <span>Sai ({result.answered - result.correct})</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-2 py-2 text-muted">
                      <span className="h-2 w-2 rounded bg-surface-container-highest" />
                      <span>Chưa làm ({result.total - result.answered})</span>
                    </div>
                  </div>
                </aside>
              </div>,
              document.body
            )}

          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
