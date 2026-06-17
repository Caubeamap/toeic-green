"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Clock,
  BookOpen,
  Headphones,
  Lightbulb,
  Flag,
  Sparkles
} from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { PracticeAttemptResult, ToeicQuestion } from "@/features/practice";
import { isQuestionNumberOnlyStem } from "@/features/practice/lib/toeic-questions";
import { formatPracticeTestTitle } from "@/features/practice/lib/practice-tests";
import { cn } from "@/lib/utils";

const PART1_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  2: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  3: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  4: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80",
  5: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  6: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
};

/* ═══════════════════════════════════════════════════════════════
   Scoring Logic Helpers
   ═══════════════════════════════════════════════════════════════ */

function roundToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function estimateSectionScore(correct: number): number {
  const rawScoreAnchors = [
    { raw: 0, scaled: 5 },
    { raw: 10, scaled: 35 },
    { raw: 20, scaled: 80 },
    { raw: 30, scaled: 130 },
    { raw: 40, scaled: 185 },
    { raw: 50, scaled: 250 },
    { raw: 60, scaled: 310 },
    { raw: 70, scaled: 365 },
    { raw: 80, scaled: 420 },
    { raw: 90, scaled: 465 },
    { raw: 100, scaled: 495 },
  ];

  const boundedCorrect = Math.max(0, Math.min(100, correct));
  const nextAnchorIndex = rawScoreAnchors.findIndex(
    (anchor) => boundedCorrect <= anchor.raw
  );

  if (nextAnchorIndex <= 0) {
    return rawScoreAnchors[0].scaled;
  }

  const previous = rawScoreAnchors[nextAnchorIndex - 1];
  const next = rawScoreAnchors[nextAnchorIndex];
  const progress = (boundedCorrect - previous.raw) / (next.raw - previous.raw);
  const scaled = previous.scaled + (next.scaled - previous.scaled) * progress;

  return Math.max(5, Math.min(495, roundToNearestFive(scaled)));
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

  const hasFullListeningSection = lcTotal === 100;
  const hasFullReadingSection = rcTotal === 100;
  const lcScaled = hasFullListeningSection ? estimateSectionScore(lcCorrect) : null;
  const rcScaled = hasFullReadingSection ? estimateSectionScore(rcCorrect) : null;
  const totalScore =
    lcScaled !== null && rcScaled !== null ? lcScaled + rcScaled : null;

  return {
    lcCorrect,
    rcCorrect,
    lcTotal,
    rcTotal,
    lcScaled,
    rcScaled,
    totalScore
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanGarbledText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\uFFFD/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/-------+/g, "-------")
    .trim();
}

function findMatchingSentenceInPassage(plainPassage: string, prefix: string): string | null {
  if (!prefix || prefix.trim().length < 4) return null;
  
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanPrefix = clean(prefix);
  if (!cleanPrefix) return null;
  
  const sentences = plainPassage.split(/(?<=[.?!])\s+/);
  
  let bestMatch: string | null = null;
  let bestMatchLen = 0;
  
  for (const sentence of sentences) {
    const cleanSentence = clean(sentence);
    if (cleanSentence.includes(cleanPrefix)) {
      return sentence.trim();
    }
    
    if (cleanPrefix.length > 20) {
      const halfPrefix = cleanPrefix.substring(0, Math.floor(cleanPrefix.length / 2));
      if (cleanSentence.includes(halfPrefix)) {
        if (sentence.length > bestMatchLen) {
          bestMatch = sentence.trim();
          bestMatchLen = sentence.length;
        }
      }
    }
  }
  
  if (bestMatch) return bestMatch;
  
  const first20 = prefix.substring(0, Math.min(20, prefix.length));
  const idx = plainPassage.toLowerCase().indexOf(first20.toLowerCase());
  if (idx !== -1) {
    const sub = plainPassage.substring(idx, idx + prefix.length + 120);
    const dotIdx = sub.indexOf('.');
    if (dotIdx !== -1) {
      return plainPassage.substring(idx, idx + dotIdx + 1).trim();
    }
    return plainPassage.substring(idx, idx + prefix.length + 30).trim() + "...";
  }
  
  return null;
}

function removeTrailingTruncatedQuestions(explanation: string): string {
  const lines = explanation.split('\n');
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1].trim();
    if (
      lastLine.toLowerCase().endsWith("gần nghĩa nhất với") ||
      lastLine.toLowerCase().endsWith("gần nghĩa nhất với:") ||
      lastLine.toLowerCase().startsWith("bài báo đã có thể được viết") ||
      lastLine.toLowerCase().includes("lý do nào nhất") ||
      lastLine.length < 5
    ) {
      lines.pop();
      return lines.join('\n');
    }
  }
  return explanation;
}

function getSmartExplanation(q: ToeicQuestion, passageText?: string): string {
  let explanation = q.explanation || "";
  
  if (!explanation.trim()) {
    const correctOpt = q.options.find(o => o.label === q.correctAnswer);
    const correctText = correctOpt ? correctOpt.text : "";
    
    let gen = `Chưa có giải thích chi tiết cho câu hỏi này.\n\n`;
    gen += `**Đáp án đúng:** ${q.correctAnswer}`;
    if (correctText) {
      gen += ` (${correctText})`;
    }
    
    return gen;
  }
  
  explanation = cleanGarbledText(explanation);
  
  if (passageText) {
    const plainPassage = passageText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    
    const lastQuoteIdx = Math.max(explanation.lastIndexOf('"'), explanation.lastIndexOf('“'));
    if (lastQuoteIdx !== -1) {
      const afterQuote = explanation.substring(lastQuoteIdx + 1).trim();
      const hasClosingQuote = afterQuote.includes('"') || afterQuote.includes('”');
      
      if (!hasClosingQuote && afterQuote.length > 5) {
        const quotePrefix = afterQuote.replace(/\.\.\.$/, "").trim();
        const completed = findMatchingSentenceInPassage(plainPassage, quotePrefix);
        if (completed) {
          explanation = explanation.substring(0, lastQuoteIdx + 1) + completed + `", do đó chọn đáp án đúng là **${q.correctAnswer}**.`;
        }
      }
    }
  }
  
  explanation = removeTrailingTruncatedQuestions(explanation);
  return explanation;
}

function extractQuotesFromExplanation(explanation: string): string[] {
  if (!explanation) return [];
  
  const quotes: string[] = [];
  const regex = /["“«]([^"”»]{8,})["”»]/g;
  let match;
  while ((match = regex.exec(explanation)) !== null) {
    quotes.push(match[1].trim());
  }
  
  return quotes;
}

function highlightHtmlTextSafe(html: string, quote: string): string {
  if (!quote || quote.trim().length < 5) return html;
  
  const cleanQuote = quote.trim().replace(/^[“"'"«„](.*)[”"'"»“]$/, '$1');
  const words = cleanQuote.split(/\s+/).filter(Boolean);
  if (words.length === 0) return html;
  
  const escapedWords = words.map(w => escapeRegExp(w));
  const pattern = escapedWords.join('(?:\\s+|<[^>]*>)+');
  
  try {
    const tokens = html.split(/(<[^>]+>)/g);
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    const highlightedTokens = tokens.map((token) => {
      if (token.startsWith('<') && token.endsWith('>')) {
        return token;
      }
      return token.replace(regex, '<mark class="bg-yellow-100 text-ink font-semibold border-b-2 border-yellow-400 px-1 rounded shadow-sm">$1</mark>');
    });
    
    return highlightedTokens.join('');
  } catch (e) {
    console.error("Highlight error:", e);
    return html;
  }
}

function renderExplanationText(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();
    
    if (trimmed === "") {
      return <div key={lineIdx} className="h-1" />;
    }
    
    if (trimmed.startsWith('-------') || trimmed === '------') {
      return <hr key={lineIdx} className="my-3 border-t border-outline-variant/30" />;
    }

    // Check if line is blockquote (starts with >)
    let isBlockquote = false;
    if (trimmed.startsWith('>')) {
      isBlockquote = true;
      trimmed = trimmed.substring(1).trim();
    }
    
    // Parse formatting helper (bold **text**, italic *text*)
    const parseFormattedText = (rawText: string) => {
      const boldParts = rawText.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx} className="text-primary font-black">{bPart}</strong>;
        }
        
        // Parse italics (*italic*) inside non-bold text
        const italicParts = bPart.split(/\*([^*]+)\*/g);
        return italicParts.map((iPart, iIdx) => {
          if (iIdx % 2 === 1) {
            return <em key={iIdx} className="font-semibold italic text-ink/80">{iPart}</em>;
          }
          return iPart;
        });
      });
    };
    
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      const cleanContent = trimmed.replace(/^[-•]\s*/, "");
      const cleanJSX = parseFormattedText(cleanContent);
      
      return (
        <div key={lineIdx} className="pl-3 text-on-surface-variant flex items-start gap-2 min-h-[1.25rem] py-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="flex-1 leading-relaxed">{cleanJSX}</span>
        </div>
      );
    }
    
    const contentJSX = parseFormattedText(trimmed);
    
    if (isBlockquote) {
      return (
        <blockquote key={lineIdx} className="my-2 border-l-4 border-primary/40 pl-3 py-1.5 bg-primary/5 rounded-r italic text-ink/85 text-[12px] leading-relaxed">
          {contentJSX}
        </blockquote>
      );
    }
    
    return (
      <p key={lineIdx} className="min-h-[1.25rem] text-ink/90 py-0.5 leading-relaxed">
        {contentJSX}
      </p>
    );
  });
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

function getPartsFromAnswers(answers: Record<string, string>): string[] {
  if (!answers) return [];
  const partIds = new Set<string>();
  
  Object.keys(answers).forEach((qId) => {
    const match = qId.match(/-q(\d+)$/i);
    if (match) {
      const qNum = parseInt(match[1], 10);
      if (qNum >= 1 && qNum <= 6) partIds.add("part-1");
      else if (qNum >= 7 && qNum <= 31) partIds.add("part-2");
      else if (qNum >= 32 && qNum <= 70) partIds.add("part-3");
      else if (qNum >= 71 && qNum <= 100) partIds.add("part-4");
      else if (qNum >= 101 && qNum <= 130) partIds.add("part-5");
      else if (qNum >= 131 && qNum <= 146) partIds.add("part-6");
      else if (qNum >= 147 && qNum <= 200) partIds.add("part-7");
    }
  });
  
  return Array.from(partIds);
}

export function PracticeResultReview({
  attemptResult,
}: {
  attemptResult: PracticeAttemptResult;
}) {
  const router = useRouter();
  const result = attemptResult.result;
  const test = attemptResult.test;
  const questions = attemptResult.questions;
  const displayTestTitle = useMemo(() => formatPracticeTestTitle(test), [test]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [activePassageTab, setActivePassageTab] = useState(0);
  const [prevGroupId, setPrevGroupId] = useState<string | undefined>(undefined);
  const [showTranscriptMap, setShowTranscriptMap] = useState<Record<string, boolean>>({});
  const [leftPanelLang, setLeftPanelLang] = useState<"en" | "vi">("en");
  const [isNavOpen, setIsNavOpen] = useState(false);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

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

  // Selected review question
  const currentQuestion = activeQuestions[reviewIndex];
  const totalQuestions = activeQuestions.length;

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

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });
    });
  }, []);

  // Navigation handlers
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setReviewIndex(index);
      scrollToReviewCard(activeQuestions[index].questionNumber);
    }
  }, [activeQuestions, scrollToReviewCard, totalQuestions]);

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
            
            {/* Container 1: Review Panel (Passage + Question Card) */}
            <div className="h-[min(82vh,860px)] min-h-[680px] overflow-hidden rounded-3xl border border-white shadow-glass bg-white/86 relative flex flex-1 [contain:layout_paint] [transform:translateZ(0)]">
            
            {/* 2-Column Split Review Panels */}
            <div className="flex flex-1 overflow-hidden h-full">
              
              {/* Review Left Column (Passage / Media / Photos) */}
              <div
                ref={leftPanelRef}
                className={cn(
                  "w-[48%] overflow-y-auto border-r border-outline-variant/20 p-4 md:p-6 bg-surface-container-low flex flex-col justify-start",
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
                    <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-soft max-h-[480px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQuestion.image_url || PART1_IMAGES[currentQuestion.questionNumber] || "https://images.unsplash.com/photo-1497366216548-37526070297c"}
                        alt="Question Visual"
                        className="w-full h-[380px] object-contain bg-zinc-50"
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

                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[300px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] text-xs leading-relaxed text-ink font-semibold whitespace-pre-line transition-colors duration-150">
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
                      className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] leading-relaxed"
                    >
                      {leftPanelLang === "en" ? (
                        <div 
                          className="part6-passage passage-content text-sm font-medium text-ink"
                          dangerouslySetInnerHTML={{ 
                            __html: getPart6HtmlReview(currentQuestion.passage || "")
                          }}
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
                        <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)]">
                          {passagesList.length > 0 && (
                            <div 
                              className="text-sm leading-relaxed text-ink font-medium passage-content"
                              dangerouslySetInnerHTML={{ __html: passagesList[activePassageTab]?.content || "" }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-soft max-h-[600px] lg:max-h-[700px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)] whitespace-pre-line text-sm text-muted font-medium leading-relaxed">
                        {currentQuestion.transcript}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Review Right Column (Question Card) */}
              <main
                ref={rightPanelRef}
                className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 [scrollbar-gutter:stable] [will-change:scroll-position] [transform:translateZ(0)]"
              >
                <div className="max-w-3xl mx-auto space-y-6 pb-8">
                  
                  {currentGroupQuestions.map((q) => {
                    const selected = result.answers[q.id];
                    const isCorrect = selected === q.correctAnswer;
                    const isMarked = flagsSet.has(q.id);
                    const shouldShowStem = !isQuestionNumberOnlyStem(q);

                    // Compact review row for Part 1/2
                    if (q.partId === "part-1" || q.partId === "part-2") {
                      return (
                        <div
                          key={q.id}
                          id={`review-card-${q.questionNumber}`}
                          onClick={() => {
                            if (q.id !== currentQuestion.id) {
                              goTo(activeQuestions.indexOf(q));
                            }
                          }}
                          className={cn(
                            "rounded-2xl border p-4 transition-colors duration-150 flex flex-col gap-3 shadow-soft cursor-pointer relative [content-visibility:auto] [contain-intrinsic-size:1px_180px] [contain:layout_paint]",
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
                                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black border transition-colors duration-150 relative",
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
                                  className="inline-flex w-fit items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/10"
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
                                    {getSmartExplanation(q, q.passage || q.transcript || "") && (
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-wider mb-1">Dịch nghĩa & Giải thích:</p>
                                        <div className="text-ink/90 text-[13px] font-medium space-y-1.5">{renderExplanationText(getSmartExplanation(q, q.passage || q.transcript || ""))}</div>
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
                            goTo(activeQuestions.indexOf(q));
                          }
                        }}
                        className={cn(
                          "rounded-2xl border p-5 transition-colors duration-150 shadow-soft relative cursor-pointer [content-visibility:auto] [contain-intrinsic-size:1px_260px] [contain:layout_paint]",
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
                        {shouldShowStem && (
                          <p className="text-xs font-bold leading-relaxed text-ink mb-4">
                            {q.stem}
                          </p>
                        )}

                        {/* Options checkboard */}
                        <div className="grid gap-2.5">
                          {q.options.map((opt) => {
                            const isOptSelected = selected === opt.label;
                            const isOptCorrect = q.correctAnswer === opt.label;

                            return (
                              <div
                                key={opt.label}
                                className={cn(
                                  "flex w-full items-center gap-3.5 rounded-xl border px-4 py-2.5 text-xs font-semibold leading-relaxed transition-colors",
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
                          const explanationText = getSmartExplanation(q, q.passage || q.transcript || "");
                          
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
                                  className="inline-flex w-fit items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10"
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
                                        <div className="bg-white/60 border border-outline-variant/15 rounded-lg p-3 text-ink/90 text-[13px] font-medium space-y-1.5">
                                          {renderExplanationText(explanationText)}
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
                                                            <div className="text-[13px] leading-relaxed text-ink/90 font-medium bg-white/60 border border-outline-variant/15 rounded-lg p-3 space-y-1.5">
                                {renderExplanationText(explanationText)}
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
            
            </div> {/* Container 1 End */}

            {/* Sidebar Jump Board on Review */}
            {isNavOpen && (
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
                          const idx = activeQuestions.indexOf(q);
                          const isSelected = idx === reviewIndex;
                          const selected = result.answers[q.id];
                          const isCorrect = selected === q.correctAnswer;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                goTo(idx);
                                setIsNavOpen(false);
                              }}
                              aria-current={isSelected ? "true" : undefined}
                              className={cn(
                                "relative flex h-8 w-full items-center justify-center rounded-xl text-[10px] font-black transition-colors",
                                isSelected
                                  ? "ring-2 ring-primary ring-offset-1 text-ink bg-primary-container/60"
                                  : "",
                                selected
                                  ? isCorrect
                                    ? "bg-green-600 text-white shadow-soft"
                                    : "bg-red-500 text-white shadow-soft"
                                  : "bg-surface-container-low text-muted hover:bg-primary-container/35 hover:text-primary"
                              )}
                            >
                              {q.questionNumber}
                            </button>
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
                          const idx = activeQuestions.indexOf(q);
                          const isSelected = idx === reviewIndex;
                          const selected = result.answers[q.id];
                          const isCorrect = selected === q.correctAnswer;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                goTo(idx);
                                setIsNavOpen(false);
                              }}
                              aria-current={isSelected ? "true" : undefined}
                              className={cn(
                                "relative flex h-8 w-full items-center justify-center rounded-xl text-[10px] font-black transition-colors",
                                isSelected
                                  ? "ring-2 ring-primary ring-offset-1 text-ink bg-primary-container/60"
                                  : "",
                                selected
                                  ? isCorrect
                                    ? "bg-green-600 text-white shadow-soft"
                                    : "bg-red-500 text-white shadow-soft"
                                  : "bg-surface-container-low text-muted hover:bg-primary-container/35 hover:text-primary"
                              )}
                            >
                              {q.questionNumber}
                            </button>
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
              </div>
            )}

          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}

function ResultMetricCard({
  icon,
  title,
  value,
  subValue,
  tone,
}: {
  icon: ReactNode;
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
