"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Headphones,
  Lightbulb,
  Flag,
  Sparkles
} from "lucide-react";
import { getPracticeTestById } from "@/lib/practice-tests";
import { getQuestionsForTest, type ToeicQuestion } from "@/lib/toeic-questions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════ */

type SavedResult = {
  testId: string;
  testTitle: string;
  correct: number;
  total: number;
  answered: number;
  flagged: number;
  flaggedIds?: string[];
  duration: number;
  answers: Record<string, string>;
  timestamp: string;
};



// Part 1 specific images (matching TestTakingView)
const PART1_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  2: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  3: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  4: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80",
  5: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  6: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
};

// Grammar explanations mock database matching the practice test
const EXPLANATIONS: Record<string, { desc: string; translation?: string }> = {
  "part-5": {
    desc: "Căn cứ vào cấu trúc ngữ pháp và nghĩa của câu để chọn đáp án đúng nhất. Ví dụ như hòa hợp chủ vị, các thì, từ loại danh/động/tính/trạng từ hoặc các giới từ đi kèm động từ.",
  },
  "part-6": {
    desc: "Điền từ hoặc câu vào đoạn văn cần chú ý tính mạch lạc của văn bản, sử dụng các từ nối logic (however, therefore, in addition) và chọn từ loại thích hợp dựa theo từ đứng trước và đứng sau chỗ trống.",
  },
  "part-7": {
    desc: "Đọc kỹ từ khóa trong câu hỏi để quét (scanning) nhanh thông tin trong văn bản đọc. Với câu hỏi ý chính, hãy chú ý phần mở đầu và kết thúc của các bức thư, email, thông báo.",
  }
};

/* ═══════════════════════════════════════════════════════════════
   Scoring Logic Helpers
   ═══════════════════════════════════════════════════════════════ */

function estimateSectionScore(correct: number): number {
  if (correct === 0) return 5;
  if (correct <= 10) return 5 + (correct - 1) * 5;
  if (correct <= 50) return 50 + (correct - 10) * 5;
  if (correct <= 90) return 250 + (correct - 50) * 5;
  return 450 + (correct - 90) * 4.5;
}

function calculateScore(questions: ToeicQuestion[], answers: Record<string, string>) {
  let lcCorrect = 0;
  let rcCorrect = 0;
  let lcTotal = 0;
  let rcTotal = 0;

  questions.forEach((q) => {
    const isListening = ["part-1", "part-2", "part-3", "part-4"].includes(q.partId);
    if (isListening) {
      lcTotal++;
      if (answers[q.id] === q.correctAnswer) lcCorrect++;
    } else {
      rcTotal++;
      if (answers[q.id] === q.correctAnswer) rcCorrect++;
    }
  });

  const lcScaled = Math.round(estimateSectionScore(lcCorrect) / 5) * 5;
  const rcScaled = Math.round(estimateSectionScore(rcCorrect) / 5) * 5;

  return {
    lcCorrect,
    rcCorrect,
    lcTotal,
    rcTotal,
    lcScaled: Math.min(495, lcScaled),
    rcScaled: Math.min(495, rcScaled),
    totalScore: Math.min(990, lcScaled + rcScaled)
  };
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

function splitTranscript(text?: string | null) {
  if (!text) return { english: "", vietnamese: "" };
  const markers = [
    "Dịch nghĩa:",
    "Dịch nghĩa\n",
    "Dịch nghĩa :\n",
    "Dịch:",
    "Dịch \n",
    "Bản dịch:"
  ];
  for (const marker of markers) {
    const parts = text.split(marker);
    if (parts.length > 1) {
      return {
        english: parts[0].trim(),
        vietnamese: parts.slice(1).join(marker).trim()
      };
    }
  }
  return { english: text.trim(), vietnamese: "" };
}

export default function LatestResultPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();

  const [result, setResult] = useState<SavedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [activePassageTab, setActivePassageTab] = useState(0);
  const [prevGroupId, setPrevGroupId] = useState<string | undefined>(undefined);
  const [showTranscriptMap, setShowTranscriptMap] = useState<Record<string, boolean>>({});
  const [leftPanelLang, setLeftPanelLang] = useState<"en" | "vi">("en");

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const test = getPracticeTestById(params.testId);
  const [questions, setQuestions] = useState<ToeicQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Load results from SessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("toeic-test-result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedResult;
        if (parsed.testId === params.testId) {
          setResult(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved TOEIC result", e);
      }
    }
    setLoading(false);
  }, [params.testId]);

  // Load questions asynchronously
  useEffect(() => {
    async function loadQuestions() {
      try {
        if (params.testId.startsWith("practice-toeic-test-")) {
          const res = await fetch(`/data/toeic-questions/${params.testId}.json`);
          if (res.ok) {
            const data = await res.json();
            setQuestions(data);
            setLoadingQuestions(false);
            return;
          }
        }
        const staticQs = getQuestionsForTest(params.testId);
        setQuestions(staticQs);
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [params.testId]);

  // Compute stats
  const stats = useMemo(() => {
    if (!result || questions.length === 0) return null;
    return calculateScore(questions, result.answers);
  }, [result, questions]);

  // Selected review question
  const currentQuestion = questions[reviewIndex];
  const totalQuestions = questions.length;

  // Resolve audio URL for the current active question/group
  const currentQuestionAudioUrl = useMemo(() => {
    if (!currentQuestion) return null;
    if (currentQuestion.audio_url) return currentQuestion.audio_url;
    if (currentQuestion.passageGroupId) {
      const groupFirst = questions.find(
        (q) => q.passageGroupId === currentQuestion.passageGroupId && q.audio_url
      );
      return groupFirst?.audio_url || null;
    }
    return null;
  }, [currentQuestion, questions]);

  // Track prevGroupId for render-phase resets
  if (currentQuestion?.passageGroupId !== prevGroupId) {
    setPrevGroupId(currentQuestion?.passageGroupId);
    setActivePassageTab(0);
    setLeftPanelLang("en");
  }
  // Set of flagged question IDs
  const flagsSet = useMemo(() => {
    return new Set(result?.flaggedIds || []);
  }, [result?.flaggedIds]);
  // Group questions by passageGroupId to render details on review.
  // For Part 1, 2, 5, return all questions in that part to show them as a scrollable list.
  const currentGroupQuestions = useMemo(() => {
    if (!currentQuestion) return [];
    if (
      currentQuestion.partId === "part-1" ||
      currentQuestion.partId === "part-2" ||
      currentQuestion.partId === "part-5"
    ) {
      return questions.filter((q) => q.partId === currentQuestion.partId);
    }
    if (currentQuestion.passageGroupId) {
      return questions.filter((q) => q.passageGroupId === currentQuestion.passageGroupId);
    }
    return [currentQuestion];
  }, [currentQuestion, questions]);

  // Split multi-passages string by "--- Passage X: Title ---" (review view)
  const passagesList = useMemo(() => {
    if (!currentQuestion?.passage) return [];
    const text = currentQuestion.passage;
    const regex = /---\s*Passage\s*(\d+):\s*([^-]+)\s*---/g;
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      return [{ title: "Văn bản đọc", content: text }];
    }

    const list: { title: string; content: string }[] = [];
    const splits = text.split(/---\s*Passage\s*\d+:[^-]+---/g);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const index = i + 1;
      list.push({
        title: `Đoạn ${match[1]}: ${match[2].trim()}`,
        content: (splits[index] || "").trim(),
      });
    }
    return list;
  }, [currentQuestion]);

  // Navigation handlers
  const goTo = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setReviewIndex(index);
      
      const qNum = questions[index].questionNumber;
      setTimeout(() => {
        const element = document.getElementById(`review-card-${qNum}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };

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
      const correspondingQ = questions.find((q) => q.questionNumber === qNum);
      if (!correspondingQ) return match;

      const isCurrent = correspondingQ.id === currentQuestion.id;
      
      // Correct check
      let isCorrect = false;
      let isAnswered = false;
      let selected = "";
      if (result) {
        selected = result.answers[correspondingQ.id] || "";
        isAnswered = !!selected;
        isCorrect = selected === correspondingQ.correctAnswer;
      }

      const btnClass = cn(
        "mx-1 inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-xs font-black ring-1 transition duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary",
        isCurrent ? "scale-105 ring-primary" : "",
        isAnswered
          ? isCorrect
            ? "bg-green-500 text-white ring-green-600 shadow-sm"
            : "bg-red-500 text-white ring-red-600 shadow-sm"
          : "bg-surface-container-highest text-muted ring-outline-variant"
      );

      const textVal = `(${qNum})${isAnswered ? ` [ ${selected} ]` : ""}`;
      return `<button type="button" data-qnum="${qNum}" class="${btnClass}">${textVal}</button>`;
    });
  };

  const handlePassageClickReview = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest("button[data-qnum]");
    if (button) {
      const qNum = parseInt(button.getAttribute("data-qnum") || "", 10);
      const correspondingQ = questions.find((q) => q.questionNumber === qNum);
      if (correspondingQ) {
        goTo(questions.indexOf(correspondingQ));
      }
    }
  };

  const isLoading = loading || loadingQuestions;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-muted">Đang tải kết quả thi...</p>
        </div>
      </div>
    );
  }

  if (!test || !result || questions.length === 0 || !stats) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-32 grid place-items-center">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white/60 p-10 text-center shadow-glass backdrop-blur-xl">
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
        <Footer />
      </>
    );
  }

  // Calculate section scores
  const scorePercent = Math.round((result.correct / result.total) * 100);

  return (
    <>
      <Header />
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

          <div className="rounded-3xl border border-white bg-white/70 p-6 shadow-glass backdrop-blur-md">
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
                      <p className="text-4xl font-black tracking-tight text-primary">{stats.totalScore}</p>
                      <p className="text-[10px] font-black uppercase text-muted tracking-wider mt-0.5">Ước tính điểm</p>
                    </div>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-black text-ink">KẾT QUẢ BÀI THI</h3>
                <p className="text-xs text-muted mt-1 font-semibold">{test.title} {test.subtitle}</p>
              </div>

              {/* Grid Metrics */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-4 w-4" />
                    </span>
                    <h2 className="text-xl font-black text-ink">Báo cáo năng lực làm bài</h2>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed font-medium">
                    Bài thi TOEIC ước lượng điểm dựa trên thang điểm chuẩn từ số câu đúng. Bạn hãy rà soát kỹ các câu hỏi sai bên dưới để tối ưu điểm số cho các lần thi sau.
                  </p>
                </div>

                {/* Score stats */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ResultMetricCard
                    icon={<Headphones className="h-4 w-4" />}
                    title="Nghe (LC)"
                    value={`${stats.lcCorrect}/${stats.lcTotal} câu`}
                    subValue={`~ ${stats.lcScaled} điểm`}
                    tone="green"
                  />
                  <ResultMetricCard
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Đọc (RC)"
                    value={`${stats.rcCorrect}/${stats.rcTotal} câu`}
                    subValue={`~ ${stats.rcScaled} điểm`}
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
                    subValue={`Hạn 120 phút`}
                    tone="purple"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE REVIEW & LEARNING VIEW */}
        <section className="container-shell">
          <div className="mb-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Xem lại đáp án & Giải thích chi tiết</span>
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] h-[700px] overflow-hidden rounded-3xl border border-white shadow-glass bg-white/40">
            
            {/* 2-Column Split Review Panels */}
            <div className="flex flex-1 overflow-hidden h-full">
              
              {/* Review Left Column (Passage / Media / Photos) */}
              <div
                ref={leftPanelRef}
                className={cn(
                  "w-[48%] overflow-y-auto border-r border-outline-variant/20 p-4 md:p-6 bg-surface-container-low flex flex-col justify-start",
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
                    <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-soft max-h-[350px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQuestion.image_url || PART1_IMAGES[currentQuestion.questionNumber] || "https://images.unsplash.com/photo-1497366216548-37526070297c"}
                        alt="Question Visual"
                        className="w-full h-[260px] object-cover"
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
                      <p className="mt-1 text-sm font-bold text-ink italic">&ldquo;{currentQuestion.stem}&rdquo;</p>
                    </div>
                  </div>
                )}

                {/* Part 3 & 4: Audio Transcript Dialogues */}
                {(currentQuestion.partId === "part-3" || currentQuestion.partId === "part-4") && (() => {
                  const { english, vietnamese } = splitTranscript(currentQuestion.transcript);
                  const displayEn = currentQuestion.passage || english;
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Headphones className="h-4 w-4 text-primary" />
                            <span>Audio Transcript (Lời hội thoại)</span>
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
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
                              leftPanelLang === "en"
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted hover:text-ink"
                            )}
                          >
                            English (Gốc)
                          </button>
                          {vietnamese && (
                            <button
                              key="vi"
                              type="button"
                              onClick={() => setLeftPanelLang("vi")}
                              className={cn(
                                "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
                                leftPanelLang === "vi"
                                  ? "bg-white text-primary shadow-sm"
                                  : "text-muted hover:text-ink"
                              )}
                            >
                              Tiếng Việt (Dịch)
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[300px] overflow-y-auto text-xs leading-relaxed text-ink font-semibold whitespace-pre-line transition-all duration-200">
                        {leftPanelLang === "en" ? (
                          <div dangerouslySetInnerHTML={{ __html: displayEn }} />
                        ) : (
                          <div className="text-muted">{vietnamese}</div>
                        )}
                      </div>

                      {currentQuestion.image_url && (
                        <div className="space-y-2">
                          <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-soft max-h-[220px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentQuestion.image_url}
                              alt="Attached visual"
                              className="w-full h-[180px] object-contain"
                            />
                          </div>
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
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
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
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
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
                    
                    <div 
                      className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto leading-relaxed cursor-pointer"
                      onClick={leftPanelLang === "en" ? handlePassageClickReview : undefined}
                    >
                      {leftPanelLang === "en" ? (
                        <div 
                          className="text-sm font-medium text-ink passage-content"
                          dangerouslySetInnerHTML={{ __html: getPart6HtmlReview(currentQuestion.passage || "") }}
                        />
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
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
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
                              "rounded-md px-2.5 py-1 text-[10px] font-black transition active:scale-95",
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
                                  "rounded-lg px-3 py-1.5 text-[10px] font-black transition whitespace-nowrap active:scale-95",
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
                        <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto">
                          {passagesList.length > 0 && (
                            <div 
                              className="text-sm leading-relaxed text-ink font-medium passage-content"
                              dangerouslySetInnerHTML={{ __html: passagesList[activePassageTab]?.content || "" }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto whitespace-pre-line text-sm text-muted font-medium leading-relaxed">
                        {currentQuestion.transcript}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Review Right Column (Question Card) */}
              <main
                ref={rightPanelRef}
                className="flex-1 overflow-y-auto p-4 md:p-6"
              >
                <div className="max-w-xl mx-auto space-y-6">
                  
                  {currentGroupQuestions.map((q) => {
                    const selected = result.answers[q.id];
                    const isCorrect = selected === q.correctAnswer;
                    const isMarked = flagsSet.has(q.id);

                    // Compact review row for Part 1/2
                    if (q.partId === "part-1" || q.partId === "part-2") {
                      return (
                        <div
                          key={q.id}
                          id={`review-card-${q.questionNumber}`}
                          onClick={() => {
                            if (q.id !== currentQuestion.id) {
                              setReviewIndex(questions.indexOf(q));
                            }
                          }}
                          className={cn(
                            "rounded-2xl border p-4 transition duration-200 flex flex-col gap-3 shadow-soft cursor-pointer relative",
                            q.id === currentQuestion.id
                              ? "border-primary/40 bg-white ring-2 ring-primary/5"
                              : "border-outline-variant/20 bg-white/70 hover:border-outline-variant/50 hover:bg-white"
                          )}
                        >
                          {/* Sidebar active focus */}
                          {q.id === currentQuestion.id && (
                            <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r bg-primary" />
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-ink">Question {q.questionNumber}</span>
                              {isMarked && (
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200">
                                  <Flag className="h-2.5 w-2.5 fill-current" />
                                </span>
                              )}
                            </div>

                            {/* Options horizontal bar */}
                            <div className="flex flex-wrap items-center gap-2.5">
                              {q.options.map((opt) => {
                                const isOptSelected = selected === opt.label;
                                const isOptCorrect = q.correctAnswer === opt.label;

                                return (
                                  <span
                                    key={opt.label}
                                    className={cn(
                                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black border transition-all duration-150 relative",
                                      isOptCorrect
                                        ? "bg-green-600 text-white border-green-600 shadow-soft"
                                        : isOptSelected
                                        ? "bg-red-500 text-white border-red-500 shadow-soft"
                                        : "bg-surface-container-low text-muted border-outline-variant/40"
                                    )}
                                    title={opt.text}
                                  >
                                    {opt.label}
                                    {isOptCorrect && isOptSelected && (
                                      <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center ring-1 ring-green-600">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                                      </span>
                                    )}
                                    {!isOptCorrect && isOptSelected && (
                                      <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center ring-1 ring-red-500">
                                        <XCircle className="h-2.5 w-2.5 text-red-500" />
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>

                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border self-end sm:self-auto",
                                selected
                                  ? isCorrect
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                  : "bg-zinc-50 text-zinc-500 border-zinc-200"
                              )}
                            >
                              {selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa trả lời"}
                            </span>
                          </div>

                          {/* Toggle Transcript and Translation for Part 1/2 */}
                          {q.id === currentQuestion.id && (() => {
                            const isTranscriptOpen = !!showTranscriptMap[q.id];
                            return (
                              <div className="mt-2 flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTranscriptMap(prev => ({ ...prev, [q.id]: !prev[q.id] }));
                                  }}
                                  className="inline-flex w-fit items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80 transition active:scale-95 bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/10"
                                >
                                  <Headphones className="h-3 w-3" />
                                  <span>{isTranscriptOpen ? "Ẩn Script & Dịch" : "Xem Script & Dịch"}</span>
                                </button>
                                
                                {isTranscriptOpen && (
                                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3.5 space-y-2.5 animate-[fadeIn_0.2s_ease-out] text-[11px] font-semibold text-ink leading-relaxed">
                                    {q.transcript && (
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-0.5">Lời thoại Tiếng Anh (Audio Script):</p>
                                        <p className="italic text-ink font-bold">&ldquo;{q.transcript}&rdquo;</p>
                                      </div>
                                    )}
                                    {q.explanation && (
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-0.5">Dịch nghĩa & Giải thích:</p>
                                        <p className="text-muted whitespace-pre-line leading-relaxed">{q.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={q.id}
                        id={`review-card-${q.questionNumber}`}
                        onClick={() => {
                          if (q.id !== currentQuestion.id) {
                            setReviewIndex(questions.indexOf(q));
                          }
                        }}
                        className={cn(
                          "rounded-2xl border p-5 transition duration-300 shadow-soft relative cursor-pointer",
                          q.id === currentQuestion.id
                            ? "border-primary/40 bg-white ring-2 ring-primary/5"
                            : "border-outline-variant/20 bg-white/70 hover:border-outline-variant/50 hover:bg-white"
                        )}
                      >
                        {/* Sidebar active focus */}
                        {q.id === currentQuestion.id && (
                          <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r bg-primary" />
                        )}

                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-ink">Question {q.questionNumber}</span>
                            {isMarked && (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200">
                                <Flag className="h-3 w-3 fill-current" />
                              </span>
                            )}
                          </div>
                          
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border",
                              selected
                                ? isCorrect
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                : "bg-zinc-50 text-zinc-500 border-zinc-200"
                            )}
                          >
                            {selected ? (isCorrect ? "Đúng" : "Sai") : "Chưa trả lời"}
                          </span>
                        </div>

                        {/* Question Stem */}
                        <p className="text-xs font-bold leading-relaxed text-ink mb-4">
                          {q.stem}
                        </p>

                        {/* Options checkboard */}
                        <div className="grid gap-2.5">
                          {q.options.map((opt) => {
                            const isOptSelected = selected === opt.label;
                            const isOptCorrect = q.correctAnswer === opt.label;

                            return (
                              <div
                                key={opt.label}
                                className={cn(
                                  "flex w-full items-center gap-3.5 rounded-xl border px-4 py-2.5 text-xs font-semibold leading-relaxed transition-all",
                                  isOptCorrect
                                    ? "border-green-500/40 bg-green-500/10 text-ink shadow-sm"
                                    : isOptSelected
                                    ? "border-red-400 bg-red-50 text-ink"
                                    : "border-outline-variant/30 bg-white/50 text-muted"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                                    isOptCorrect
                                      ? "bg-green-600 text-white shadow-soft"
                                      : isOptSelected
                                      ? "bg-red-500 text-white shadow-soft"
                                      : "bg-surface-container-highest text-muted"
                                  )}
                                >
                                  {opt.label}
                                </span>
                                <span className="flex-1 text-[11px] font-bold">
                                  {opt.text}
                                </span>

                                {isOptCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                                {!isOptCorrect && isOptSelected && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation & Transcript box */}
                        {q.id === currentQuestion.id && (() => {
                          const isListening = ["part-3", "part-4"].includes(q.partId);
                          const explanationText = q.explanation || EXPLANATIONS[q.partId]?.desc || EXPLANATIONS["part-5"].desc;
                          
                          if (isListening) {
                            const isTranscriptOpen = !!showTranscriptMap[q.id];
                            const { english } = splitTranscript(q.transcript);
                            const displayScript = english || q.passage || "";
                            
                            return (
                              <div className="mt-5 flex flex-col gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTranscriptMap(prev => ({ ...prev, [q.id]: !prev[q.id] }));
                                  }}
                                  className="inline-flex w-fit items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition active:scale-95 bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10"
                                >
                                  <Headphones className="h-3.5 w-3.5" />
                                  <span>{isTranscriptOpen ? "Ẩn Script & Dịch" : "Xem Script & Dịch"}</span>
                                </button>
                                
                                {isTranscriptOpen && (
                                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-3 animate-[fadeIn_0.2s_ease-out] text-xs font-semibold text-ink leading-relaxed">
                                    {displayScript && (
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Lời thoại Tiếng Anh (Audio Script):</p>
                                        <div className="bg-white/50 border border-outline-variant/10 rounded-lg p-2.5 italic text-ink font-bold whitespace-pre-line">
                                          {displayScript}
                                        </div>
                                      </div>
                                    )}
                                    {explanationText && (
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Dịch nghĩa & Giải thích:</p>
                                        <div className="bg-white/50 border border-outline-variant/10 rounded-lg p-2.5 text-muted whitespace-pre-line leading-relaxed">
                                          {explanationText}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Reading explanation (Part 5, 6, 7)
                          return (
                            <div className="mt-5 rounded-xl border border-primary/20 bg-primary-container/10 p-4 animate-[fadeIn_0.2s_ease-out] shadow-soft">
                              <div className="flex items-center gap-1.5 text-xs font-black text-primary mb-2.5">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                <span>Giải thích đáp án (Ngữ pháp & Vị trí)</span>
                              </div>
                              <div className="text-[11px] leading-relaxed text-ink font-semibold whitespace-pre-line bg-white/60 border border-outline-variant/15 rounded-lg p-3">
                                {explanationText}
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    );
                  })}

                </div>
              </main>

            </div>

            {/* Sidebar Jump Board on Review */}
            <aside className="w-full shrink-0 border-l border-outline-variant/20 bg-white/60 flex flex-col h-full overflow-hidden">
              <div className="border-b border-outline-variant/30 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted">Điều hướng câu hỏi</h3>
                <p className="text-[10px] text-muted mt-0.5">Click vào số câu để xem lại</p>
              </div>

              {/* Grid with correct/incorrect coloring */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Listening List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-outline-variant/15 pb-1">
                    <span className="text-[9px] font-black uppercase text-primary">Listening REVIEW</span>
                    <span className="text-[8px] font-bold text-muted">1-100</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {questions.slice(0, 100).map((q) => {
                      const idx = questions.indexOf(q);
                      const isSelected = idx === reviewIndex;
                      const selected = result.answers[q.id];
                      const isCorrect = selected === q.correctAnswer;

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => goTo(idx)}
                          className={cn(
                            "relative flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black transition active:scale-90",
                            isSelected
                              ? "ring-2 ring-primary ring-offset-1 text-ink"
                              : "",
                            selected
                              ? isCorrect
                                ? "bg-green-600 text-white shadow-soft"
                                : "bg-red-500 text-white shadow-soft"
                              : "bg-surface-container-highest/60 text-muted"
                          )}
                        >
                          {q.questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reading List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-outline-variant/15 pb-1">
                    <span className="text-[9px] font-black uppercase text-secondary">Reading REVIEW</span>
                    <span className="text-[8px] font-bold text-muted">101-200</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {questions.slice(100).map((q) => {
                      const idx = questions.indexOf(q);
                      const isSelected = idx === reviewIndex;
                      const selected = result.answers[q.id];
                      const isCorrect = selected === q.correctAnswer;

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => goTo(idx)}
                          className={cn(
                            "relative flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black transition active:scale-90",
                            isSelected
                              ? "ring-2 ring-primary ring-offset-1 text-ink"
                              : "",
                            selected
                              ? isCorrect
                                ? "bg-green-600 text-white shadow-soft"
                                : "bg-red-500 text-white shadow-soft"
                              : "bg-surface-container-highest/60 text-muted"
                          )}
                        >
                          {q.questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sidebar Legend for Review */}
              <div className="border-t border-outline-variant/30 p-4 bg-white/40 space-y-2 text-[10px] font-black text-muted">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-green-600" />
                  <span>Correct ({result.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-red-500" />
                  <span>Incorrect ({result.answered - result.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-surface-container-highest" />
                  <span>Unanswered ({result.total - result.answered})</span>
                </div>
              </div>
            </aside>

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Helper Card components
   ═══════════════════════════════════════════════════════════════ */

function ResultMetricCard({
  icon,
  title,
  value,
  subValue,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subValue: string;
  tone: "green" | "blue" | "emerald" | "purple";
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-white/60 p-4 shadow-soft">
      <div
        className={cn(
          "mb-3 flex h-8 w-8 items-center justify-center rounded-xl",
          tone === "green" && "bg-primary-container/40 text-on-primary-container",
          tone === "blue" && "bg-blue-50 text-blue-700 border border-blue-100",
          tone === "emerald" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
          tone === "purple" && "bg-purple-50 text-purple-700 border border-purple-100"
        )}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted">{title}</p>
      <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
      <p className="text-[10px] font-bold text-muted mt-0.5">{subValue}</p>
    </div>
  );
}
