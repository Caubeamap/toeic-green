"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Headphones,
  Send,
  X,
  Play,
  Pause,
  Maximize2,
  ListMusic,
  SkipBack,
  SkipForward
} from "lucide-react";
import type { PracticeTest } from "@/lib/practice-tests";
import {
  LATEST_PRACTICE_RESULT_KEY,
  savePracticeAttemptResult,
  type SavedPracticeResult
} from "@/lib/practice-progress";
import type { ToeicQuestion } from "@/lib/toeic-questions";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════ */

type AnswerMap = Record<string, string>; // questionId → selected option label
type FlagSet = Set<string>; // questionId set

const PART_DESCRIPTIONS: Record<string, string> = {
  "part-1": "Photographs (Mô tả tranh)",
  "part-2": "Question-Response (Hỏi đáp)",
  "part-3": "Conversations (Hội thoại ngắn)",
  "part-4": "Short Talks (Bài nói ngắn)",
  "part-5": "Incomplete Sentences (Điền vào câu)",
  "part-6": "Text Completion (Điền vào đoạn văn)",
  "part-7": "Reading Comprehension (Đọc hiểu)",
};

const PART_SHORT_LABELS: Record<string, string> = {
  "part-1": "Part 1",
  "part-2": "Part 2",
  "part-3": "Part 3",
  "part-4": "Part 4",
  "part-5": "Part 5",
  "part-6": "Part 6",
  "part-7": "Part 7",
};

// Part 1 specific images (Unsplash Office/Business situations matching questions)
const PART1_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80", // Q1: Two people shaking hands
  2: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", // Q2: Shelves fully stocked
  3: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80", // Q3: Presenter pointing at screen
  4: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80", // Q4: Parked cars along curb
  5: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80", // Q5: Office chairs around table
  6: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", // Q6: Diners in a restaurant
};

/* ═══════════════════════════════════════════════════════════════
   Countdown Timer Hook
   ═══════════════════════════════════════════════════════════════ */

function useCountdown(totalMinutes: number) {
  const isCountUp = totalMinutes === 0;
  const [remaining, setRemaining] = useState(isCountUp ? 0 : totalMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((seconds) => {
        if (isCountUp) {
          return seconds + 1;
        } else {
          if (seconds <= 1) {
            setRunning(false);
            return 0;
          }
          return seconds - 1;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isCountUp]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const display = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const percentage = totalMinutes > 0 ? ((totalMinutes * 60 - remaining) / (totalMinutes * 60)) * 100 : 0;

  return { remaining, display, percentage, running, setRunning, isCountUp };
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export function PracticeExamSession({
  test,
  questions,
  customTimeLimit,
}: {
  test: PracticeTest;
  questions: ToeicQuestion[];
  customTimeLimit?: number;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flags, setFlags] = useState<FlagSet>(new Set());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [isDevMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dev") === "true" || params.get("bypass") === "true") {
        return true;
      }
    }
    return false;
  });

  // Photo viewer modal state (Part 1)
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  // Real/Simulated audio states (Part 1, 2, 3, 4)
  const [audioPlaying, setAudioPlaying] = useState(() => {
    const firstQ = questions[0];
    return firstQ ? ["part-1", "part-2", "part-3", "part-4"].includes(firstQ.partId) : false;
  });
  const [audioTime, setAudioTime] = useState(0);
  const audioSpeed = 1.0;
  const [audioDuration, setAudioDuration] = useState(90);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Responsive tab state for mobile
  const [mobileActiveTab, setMobileActiveTab] = useState<"passage" | "questions">("passage");

  // Part 7 tabs state (Multi-passages)
  const [activePassageTab, setActivePassageTab] = useState(0);

  // States to track previous question parts for render-phase resets
  const [prevGroupId, setPrevGroupId] = useState<string | undefined>(currentQuestion?.passageGroupId);
  const [prevPartId, setPrevPartId] = useState<string | undefined>(currentQuestion?.partId);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const examMinutes = customTimeLimit !== undefined ? customTimeLimit : test.minutes;
  const timer = useCountdown(examMinutes);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Determine if this is a listening part
  const isListening = useMemo(() => {
    return currentQuestion ? ["part-1", "part-2", "part-3", "part-4"].includes(currentQuestion.partId) : false;
  }, [currentQuestion]);

  const isNavigationBlocked = useMemo(() => {
    return isListening && !isDevMode;
  }, [isListening, isDevMode]);

  // Group questions by passageGroupId to render them together on Part 3, 4, 6, 7.
  // For Part 1 and Part 2: show only the active question to prevent answering other questions.
  // For Part 5: show all questions in that part to show them as a scrollable list.
  const currentGroupQuestions = useMemo(() => {
    if (!currentQuestion) return [];
    if (
      currentQuestion.partId === "part-1" ||
      currentQuestion.partId === "part-2"
    ) {
      return [currentQuestion];
    }
    if (currentQuestion.partId === "part-5") {
      return questions.filter((q) => q.partId === currentQuestion.partId);
    }
    if (currentQuestion.passageGroupId) {
      return questions.filter((q) => q.passageGroupId === currentQuestion.passageGroupId);
    }
    return [currentQuestion];
  }, [currentQuestion, questions]);

  // Part grouping index maps for the sidebar
  const partGroups = useMemo(() => {
    const groups: Array<{
      partId: string;
      label: string;
      startIndex: number;
      endIndex: number;
    }> = [];
    let currentPartId = "";

    questions.forEach((q, i) => {
      if (q.partId !== currentPartId) {
        currentPartId = q.partId;
        groups.push({
          partId: q.partId,
          label: PART_SHORT_LABELS[q.partId] || q.partId,
          startIndex: i,
          endIndex: i,
        });
      } else {
        groups[groups.length - 1].endIndex = i;
      }
    });

    return groups;
  }, [questions]);

  // Current active part based on index
  const currentPart = useMemo(() => {
    return partGroups.find(
      (g) => currentIndex >= g.startIndex && currentIndex <= g.endIndex
    );
  }, [currentIndex, partGroups]);

  /* ═══════════════════════════════════════════════════════════════
     Interactive Handlers
     ═══════════════════════════════════════════════════════════════ */

  // Audio simulator ticker (fallback when no real audio_url is present)
  const activeAudioUrl = currentQuestion?.audio_url;
  useEffect(() => {
    if (activeAudioUrl) return; // Use HTML5 audio elements instead
    if (!audioPlaying) return;
    const interval = setInterval(() => {
      setAudioTime((t) => {
        if (t >= audioDuration) {
          setAudioPlaying(false);
          return 0;
        }
        return t + 1;
      });
    }, 1000 / audioSpeed);
    return () => clearInterval(interval);
  }, [audioPlaying, audioSpeed, activeAudioUrl, audioDuration]);

  // HTML5 audio play/pause controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioUrl) return;

    if (audioPlaying) {
      audio.play().catch((err) => console.log("Audio play error:", err));
    } else {
      audio.pause();
    }
  }, [audioPlaying, activeAudioUrl]);

  // Autoplay audio when switching to a listening question
  useEffect(() => {
    const isCurrentListening = currentQuestion ? ["part-1", "part-2", "part-3", "part-4"].includes(currentQuestion.partId) : false;
    if (isCurrentListening && activeAudioUrl) {
      const timerId = setTimeout(() => {
        setAudioPlaying(true);
      }, 0);
      return () => clearTimeout(timerId);
    }
  }, [activeAudioUrl, currentQuestion]);

  // Sync playback speed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioUrl) return;
    audio.playbackRate = audioSpeed;
  }, [audioSpeed, activeAudioUrl]);

  // Load new audio source when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.load();
    }

    queueMicrotask(() => {
      setAudioTime(0);
    });
  }, [activeAudioUrl]);

  // Intercept browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted) {
        e.preventDefault();
        e.returnValue = "Kết quả làm bài thi của bạn sẽ không được lưu nếu bạn thoát.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted]);

  // Reset audio & passage tab when switching groups/parts (Render phase synchronization)
  if (currentQuestion?.passageGroupId !== prevGroupId || currentQuestion?.partId !== prevPartId) {
    setPrevGroupId(currentQuestion?.passageGroupId);
    setPrevPartId(currentQuestion?.partId);
    
    // Only stop audio if we transition to a non-listening part
    const isNextListening = currentQuestion ? ["part-1", "part-2", "part-3", "part-4"].includes(currentQuestion.partId) : false;
    if (!isNextListening) {
      setAudioPlaying(false);
      setAudioTime(0);
    }
    
    setActivePassageTab(0);
    setMobileActiveTab("passage"); // Default to passage tab when switching questions
  }

  // Handle direct navigation
  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentIndex(index);
        
        // Auto scroll to focused card
        const qNum = questions[index].questionNumber;
        setTimeout(() => {
          const element = document.getElementById(`question-card-${qNum}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      }
    },
    [totalQuestions, questions]
  );

  // Find all unique audio URLs for the Listening section in order
  const uniqueAudioUrls = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const q of questions) {
      if (["part-1", "part-2", "part-3", "part-4"].includes(q.partId) && q.audio_url) {
        if (!seen.has(q.audio_url)) {
          seen.add(q.audio_url);
          urls.push(q.audio_url);
        }
      }
    }
    return urls;
  }, [questions]);

  // Keep track of the currently active track index
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Transition timer countdown (in seconds)
  const [nextTrackCountdown, setNextTrackCountdown] = useState<number | null>(null);

  // Play a specific track index
  const playTrack = useCallback(
    (index: number, autoStart = true) => {
      if (index < 0 || index >= uniqueAudioUrls.length) return;
      setNextTrackCountdown(null); // Clear countdown if any
      setCurrentTrackIndex(index);
      const targetUrl = uniqueAudioUrls[index];
      
      // Find the first question using this audio URL
      const targetQuestionIndex = questions.findIndex(q => q.audio_url === targetUrl);
      if (targetQuestionIndex !== -1) {
        goTo(targetQuestionIndex);
        if (autoStart) {
          setAudioPlaying(true);
        }
      }
    },
    [uniqueAudioUrls, questions, goTo]
  );

  // Helper to get partId of a track
  const getTrackPartId = useCallback((trackIdx: number) => {
    if (trackIdx < 0 || trackIdx >= uniqueAudioUrls.length) return undefined;
    const targetUrl = uniqueAudioUrls[trackIdx];
    const question = questions.find(q => q.audio_url === targetUrl);
    return question?.partId;
  }, [uniqueAudioUrls, questions]);

  // Sync currentTrackIndex when the active question's audio URL changes
  useEffect(() => {
    if (currentQuestion?.audio_url) {
      const idx = uniqueAudioUrls.indexOf(currentQuestion.audio_url);
      if (idx !== -1) {
        queueMicrotask(() => {
          setCurrentTrackIndex(idx);
        });
      }
    }
  }, [currentQuestion, uniqueAudioUrls]);

  // Effect to manage automated transition countdown timer
  useEffect(() => {
    if (nextTrackCountdown === null) return;
    const timerId = setTimeout(() => {
      if (nextTrackCountdown <= 1) {
        setNextTrackCountdown(null);
        if (currentTrackIndex < uniqueAudioUrls.length - 1) {
          playTrack(currentTrackIndex + 1, true);
        }
      } else {
        setNextTrackCountdown(nextTrackCountdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timerId);
  }, [nextTrackCountdown, currentTrackIndex, playTrack, uniqueAudioUrls.length]);

  const goNextGroup = useCallback(() => {
    const lastInGroupIndex = questions.indexOf(currentGroupQuestions[currentGroupQuestions.length - 1]);
    if (lastInGroupIndex + 1 < totalQuestions) {
      goTo(lastInGroupIndex + 1);
    }
  }, [currentGroupQuestions, totalQuestions, questions, goTo]);

  const goPrevGroup = useCallback(() => {
    const firstInGroupIndex = questions.indexOf(currentGroupQuestions[0]);
    if (firstInGroupIndex - 1 >= 0) {
      // Find the group of the previous question
      const prevQ = questions[firstInGroupIndex - 1];
      if (prevQ.passageGroupId) {
        const prevGroup = questions.filter(q => q.passageGroupId === prevQ.passageGroupId);
        goTo(questions.indexOf(prevGroup[0]));
      } else {
        goTo(firstInGroupIndex - 1);
      }
    }
  }, [currentGroupQuestions, questions, goTo]);

  // Answer selection
  const selectAnswer = useCallback((qId: string, label: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: label }));
  }, [submitted]);

  // Toggle flag for a question
  const toggleFlag = useCallback((qId: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  }, []);

  // Keyboard navigation & inputs
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (showSubmitDialog) return;
      
      // Arrow navigation
      if (e.key === "ArrowRight") {
        if (isNavigationBlocked) return;
        const lastInGroup = currentGroupQuestions[currentGroupQuestions.length - 1];
        const lastIndex = questions.indexOf(lastInGroup);
        if (currentIndex < lastIndex) {
          goTo(currentIndex + 1);
        } else {
          goNextGroup();
        }
      }
      if (e.key === "ArrowLeft") {
        if (isNavigationBlocked) return;
        if (currentIndex > questions.indexOf(currentGroupQuestions[0])) {
          goTo(currentIndex - 1);
        } else {
          goPrevGroup();
        }
      }

      // Choice answering keys for the active question
      const q = questions[currentIndex];
      if (q) {
        if (e.key.toLowerCase() === "a") selectAnswer(q.id, "A");
        if (e.key.toLowerCase() === "b") selectAnswer(q.id, "B");
        if (e.key.toLowerCase() === "c") selectAnswer(q.id, "C");
        if (e.key.toLowerCase() === "d" && q.options.length >= 4) selectAnswer(q.id, "D");
      }
      
      if (e.key.toLowerCase() === "f") toggleFlag(currentQuestion.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, currentGroupQuestions, questions, goNextGroup, goPrevGroup, goTo, showSubmitDialog, currentQuestion, selectAnswer, toggleFlag, isNavigationBlocked]);

  // Submit test and format results
  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    timer.setRunning(false);
    setShowSubmitDialog(false);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });

    const examMinutes = customTimeLimit !== undefined ? customTimeLimit : test.minutes;

    const result: SavedPracticeResult = {
      testId: test.id,
      testTitle: `${test.title} ${test.subtitle}`,
      correct: correctCount,
      total: totalQuestions,
      answered: answeredCount,
      flagged: flags.size,
      flaggedIds: Array.from(flags),
      duration: timer.isCountUp ? timer.remaining : examMinutes * 60 - timer.remaining,
      answers,
      timestamp: new Date().toISOString(),
      parts: Array.from(new Set(questions.map((q) => q.partId))),
      timeLimit: examMinutes,
    };

    sessionStorage.setItem(LATEST_PRACTICE_RESULT_KEY, JSON.stringify(result));
    savePracticeAttemptResult(test, result);
    router.push(`/practice/${test.id}/results/latest`);
  }, [test, questions, answers, answeredCount, flags, timer, router, totalQuestions, customTimeLimit]);

  // Time-out submit
  useEffect(() => {
    if (!timer.isCountUp && timer.remaining === 0 && !submitted) {
      const id = setTimeout(() => {
        handleSubmit();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [timer.remaining, timer.isCountUp, submitted, handleSubmit]);

  /* ═══════════════════════════════════════════════════════════════
     Helper Renders & Parsers
     ═══════════════════════════════════════════════════════════════ */

  // Split multi-passages string by "--- Passage X: Title ---"
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

  // Render Part 6 blanks with clicking support & safe HTML
  const getPart6Html = useCallback((text: string) => {
    if (!text) return "";
    return text.replace(/_{2,}\((\d+)\)/g, (match, qNumStr) => {
      const qNum = parseInt(qNumStr, 10);
      const correspondingQ = questions.find((q) => q.questionNumber === qNum);
      if (!correspondingQ) return match;

      const btnClass = "mx-1 inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-xs font-black ring-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-highest text-on-surface-variant ring-outline-variant hover:bg-surface-container-highest/80";
      const textVal = `_____ (${qNum})`;
      return `<button type="button" data-qnum="${qNum}" class="${btnClass}">${textVal}</button>`;
    });
  }, [questions]);

  const handlePassageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest("button[data-qnum]");
    if (button) {
      const qNum = parseInt(button.getAttribute("data-qnum") || "", 10);
      const correspondingQ = questions.find((q) => q.questionNumber === qNum);
      if (correspondingQ) {
        goTo(questions.indexOf(correspondingQ));
      }
    }
  }, [questions, goTo]);

  function formatAudioTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {activeAudioUrl && (
        <audio
          ref={audioRef}
          src={activeAudioUrl}
          onCanPlay={() => {
            if (audioPlaying && audioRef.current) {
              audioRef.current.play().catch((err) => console.log("onCanPlay play error:", err));
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const wholeSeconds = Math.floor(audioRef.current.currentTime);
              setAudioTime((current) => (current === wholeSeconds ? current : wholeSeconds));
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setAudioDuration(audioRef.current.duration || 90);
            }
          }}
          onEnded={() => {
            if (isListening && currentTrackIndex < uniqueAudioUrls.length - 1) {
              const partId = getTrackPartId(currentTrackIndex);
              if (partId === "part-1" || partId === "part-2") {
                setNextTrackCountdown(4);
                setAudioPlaying(false);
              } else {
                playTrack(currentTrackIndex + 1, true);
              }
            } else {
              setAudioPlaying(false);
              setAudioTime(0);
            }
          }}
        />
      )}
      {/* ──── Sticky Header ──── */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/30 bg-white/95 px-4 shadow-glass md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitDialog(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-container-low"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-ink md:text-base">
              {test.title} - {test.subtitle}
            </h1>
            <p className="text-[11px] font-black text-primary md:text-xs">
              {PART_SHORT_LABELS[currentQuestion.partId]}: {PART_DESCRIPTIONS[currentQuestion.partId]}
            </p>
          </div>
        </div>

        {/* Central visual progress bar (desktop only) */}
        <div className="mx-8 hidden flex-1 max-w-md items-center gap-3 lg:flex">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full bg-primary shadow-glow transition-[width] duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-black text-muted">
            Tiến độ: {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3">
          {/* Audio toggle helper during practice (only in Listening Parts) */}


          {/* Clock timer */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black tabular-nums transition-colors",
              (!timer.isCountUp && timer.remaining <= 300)
                ? "bg-red-50 text-red-600 border-red-200"
                : "border-outline-variant/40 bg-primary-container/20 text-on-primary-container"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{timer.display}</span>
          </div>

          {/* Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition",
              sidebarOpen
                ? "border-primary/20 bg-primary-container/25 text-primary"
                : "border-outline-variant/60 bg-white/60 text-muted hover:bg-white/80"
            )}
            title="Đóng/Mở bảng câu hỏi"
          >
            <ListMusic className="h-4.5 w-4.5" />
          </button>

          {/* Submit */}
          <button
            type="button"
            onClick={() => setShowSubmitDialog(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-glow transition-colors hover:bg-primary/95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* ──── Horizontal Part Tabs ──── */}
      <div className="z-20 flex shrink-0 items-center gap-2 border-b border-outline-variant/20 bg-white/50 px-4 py-2 overflow-x-auto scrollbar-none md:px-6">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted mr-2 whitespace-nowrap">Phần thi:</span>
        <div className="flex gap-2">
          {partGroups.map((g) => {
            const isPartActive = currentPart?.partId === g.partId;
            return (
              <button
                key={g.partId}
                type="button"
                disabled={isNavigationBlocked}
                onClick={() => goTo(g.startIndex)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap",
                  isPartActive
                    ? "bg-primary text-white shadow-glow"
                    : "bg-surface-container-highest/60 text-muted hover:bg-primary-container/20 hover:text-primary",
                  isNavigationBlocked && "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {PART_SHORT_LABELS[g.partId] || g.partId}
              </button>
            );
          })}
        </div>
      </div>
      {/* Mobile Tab Selector (Only shown on screens < md, and not in Part 5) */}
      {currentQuestion.partId !== "part-5" && (
        <div className="flex border-b border-outline-variant/20 bg-white md:hidden shrink-0 z-20">
          <button
            type="button"
            onClick={() => setMobileActiveTab("passage")}
            className={cn(
              "flex-1 py-3 text-center text-xs font-black transition-colors border-b-2",
              mobileActiveTab === "passage"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted hover:bg-surface-container-low"
            )}
          >
            {isListening ? "🎧 Nghe & Đề bài" : "📄 Đoạn văn đọc"}
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab("questions")}
            className={cn(
              "flex-1 py-3 text-center text-xs font-black transition-colors border-b-2",
              mobileActiveTab === "questions"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted hover:bg-surface-container-low"
            )}
          >
            ✍️ Questions & Answers
          </button>
        </div>
      )}

      {/* ──── Main Layout ──── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT COLUMN: Media / Transcript / Passage */}
        <div
          ref={leftPanelRef}
          className={cn(
            "flex-1 md:flex-[1.2] lg:flex-[1.3] overflow-y-auto border-r border-outline-variant/20 p-4 md:p-6 lg:p-8 bg-surface-container-low flex-col",
            currentQuestion.partId === "part-5"
              ? "hidden"
              : mobileActiveTab === "passage"
              ? "flex"
              : "hidden md:flex"
          )}
        >
          <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col justify-center">
            
            {/* Unified Listening Player */}
            {isListening && (
              <div className="mb-6 rounded-3xl border border-white bg-white/85 p-5 shadow-glass">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">Listening Control Tape</span>
                      <h3 className="text-sm font-extrabold text-ink mt-0.5">
                        {currentQuestion.partId === "part-1" && "Part 1: Photographs"}
                        {currentQuestion.partId === "part-2" && "Part 2: Question-Response"}
                        {currentQuestion.partId === "part-3" && "Part 3: Conversations"}
                        {currentQuestion.partId === "part-4" && "Part 4: Short Talks"}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Previous Track Button */}
                    <button
                      type="button"
                      onClick={() => playTrack(currentTrackIndex - 1, audioPlaying)}
                      disabled={currentTrackIndex === 0 || isNavigationBlocked}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-white text-ink transition hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous Track"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (nextTrackCountdown !== null) {
                          setNextTrackCountdown(null);
                          setAudioTime(0);
                          if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                          }
                          setAudioPlaying(true);
                        } else {
                          setAudioPlaying(!audioPlaying);
                        }
                      }}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-glow transition-colors duration-150",
                        audioPlaying ? "bg-primary hover:bg-primary/95" : "bg-primary/90 hover:bg-primary"
                      )}
                      aria-label={audioPlaying ? "Pause" : "Play"}
                    >
                      {audioPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                    </button>

                    {/* Next Track Button */}
                    <button
                      type="button"
                      onClick={() => playTrack(currentTrackIndex + 1, audioPlaying)}
                      disabled={currentTrackIndex === uniqueAudioUrls.length - 1 || isNavigationBlocked}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-white text-ink transition hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next Track"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>

                    {/* Progress Slider */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted mb-1">
                        {nextTrackCountdown !== null ? (
                          <span className="text-primary font-black">
                            Tự động chuyển câu sau {nextTrackCountdown}s...
                          </span>
                        ) : (
                          <span>Đang phát câu {currentQuestion.questionNumber}</span>
                        )}
                        <span>{formatAudioTime(audioTime)} / {formatAudioTime(audioDuration)}</span>
                      </div>
                      <div
                        className={cn(
                          "h-2 rounded-full bg-surface-container-highest relative",
                          isNavigationBlocked ? "cursor-default" : "cursor-pointer"
                        )}
                        onClick={(e) => {
                          if (isNavigationBlocked) return; // Disable seeking for normal users
                          if (nextTrackCountdown !== null) return; // Disable seeking during countdown transition
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newTime = Math.floor(percent * audioDuration);
                          setAudioTime(newTime);
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width]",
                            nextTrackCountdown !== null ? "bg-primary shadow-glow duration-200" : "bg-primary shadow-glow duration-200"
                          )}
                          style={{
                            width: nextTrackCountdown !== null
                              ? `${(nextTrackCountdown / 4) * 100}%`
                              : `${(audioTime / audioDuration) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-center text-muted font-bold mt-1">
                    * Băng nghe sẽ tự động chạy liên tục qua các câu hỏi và các Part để làm bài như thi thật.
                  </div>
                </div>
              </div>
            )}
            
            {/* 1. PHOTOGRAPHS (PART 1) */}
            {currentQuestion.partId === "part-1" && (
              <div className="space-y-4">
                <div className="relative group rounded-3xl overflow-hidden border border-white bg-white/80 shadow-glass max-h-[580px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQuestion.image_url || PART1_IMAGES[currentQuestion.questionNumber] || "https://images.unsplash.com/photo-1497366216548-37526070297c"}
                    alt={`TOEIC Part 1 Q${currentQuestion.questionNumber}`}
                    className="w-full h-[480px] object-contain bg-zinc-50"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomed(true)}
                      className="flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-xs font-black text-ink shadow-soft transition-colors hover:bg-white"
                    >
                      <Maximize2 className="h-4 w-4" />
                      <span>Xem ảnh lớn</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-center text-muted italic">
                  * Nhìn vào tranh và chọn câu mô tả đúng nhất trên bảng câu hỏi bên phải.
                </p>
              </div>
            )}

            {/* 2. QUESTION-RESPONSE (PART 2) */}
            {currentQuestion.partId === "part-2" && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/10" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-white shadow-glass">
                    <Headphones className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">Phần thi Nghe & Trả lời</h3>
                  <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                    Bạn sẽ nghe một câu hỏi/câu nói và 3 phương án phản hồi. Chọn phản hồi chính xác nhất trên bảng câu hỏi bên phải.
                  </p>
                </div>

                {/* Simulated Wave Animation */}
                <div className="flex items-end justify-center gap-1.5 h-16 w-48 border border-outline-variant/20 rounded-2xl bg-white/50 p-4 shadow-soft">
                  {[14, 28, 18, 36, 24, 16, 32, 12].map((h, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "w-2 bg-primary/70 rounded-full",
                        audioPlaying ? "opacity-80" : "opacity-30"
                      )}
                      style={{
                        height: audioPlaying ? `${h}px` : "6px",
                        animationDelay: `${idx * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. CONVERSATIONS & TALKS (PART 3 & 4) */}
            {(currentQuestion.partId === "part-3" || currentQuestion.partId === "part-4") && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-ink">Group Questions</h3>
                    <p className="text-xs text-muted">Questions {currentGroupQuestions[0]?.questionNumber} - {currentGroupQuestions[currentGroupQuestions.length - 1]?.questionNumber}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary uppercase">
                    {currentQuestion.partId === "part-3" ? "Conversation" : "Short Talk"}
                  </span>
                </div>
                {currentQuestion.image_url ? (
                  <div className="relative group rounded-3xl overflow-hidden border border-white bg-white/80 shadow-glass max-h-[300px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQuestion.image_url}
                      alt="Attached chart/graphic"
                      className="w-full h-[240px] object-contain"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setIsPhotoZoomed(true)}
                        className="flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-xs font-black text-ink shadow-soft transition-colors hover:bg-white"
                      >
                        <Maximize2 className="h-4 w-4" />
                        <span>Xem ảnh lớn</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-white shadow-glass mb-4">
                      <Headphones className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                      Listen to the {currentQuestion.partId === "part-3" ? "conversation" : "short talk"} from the player above and answer the questions on the right.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* 4. TEXT COMPLETION (PART 6) */}
            {currentQuestion.partId === "part-6" && (
              <div className="space-y-4">
                <div 
                  className="rounded-3xl border border-white bg-white/86 p-6 shadow-glass max-h-[650px] lg:max-h-[750px] overflow-y-auto leading-relaxed cursor-pointer"
                  onClick={handlePassageClick}
                >
                  <div 
                    className="text-sm font-medium leading-relaxed text-ink passage-content"
                    dangerouslySetInnerHTML={{ __html: getPart6Html(currentQuestion.passage || "") }}
                  />
                </div>
              </div>
            )}

            {/* 5. READING COMPREHENSION (PART 7) */}
            {currentQuestion.partId === "part-7" && (
              <div className="space-y-4">
                {/* Passage tabs (for Double / Triple passages) */}
                {passagesList.length > 1 && (
                  <div className="flex gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto scrollbar-none">
                    {passagesList.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePassageTab(idx)}
                        className={cn(
                          "rounded-xl px-4 py-2.5 text-xs font-black transition-colors whitespace-nowrap shrink-0",
                          activePassageTab === idx
                            ? "bg-primary text-white shadow-glow"
                            : "border border-outline-variant/40 bg-white/60 text-muted hover:bg-white/80"
                        )}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="rounded-3xl border border-white bg-white/86 p-6 shadow-glass max-h-[650px] lg:max-h-[750px] overflow-y-auto">
                  {passagesList.length > 0 && (
                    <div 
                      className="text-sm leading-relaxed text-ink font-medium passage-content"
                      dangerouslySetInnerHTML={{ __html: passagesList[activePassageTab]?.content || "" }}
                    />
                  )}
                </div>
              </div>
            )}



          </div>
        </div>

        {/* RIGHT COLUMN: Question and Answers Area */}
        <main
          ref={rightPanelRef}
          className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8",
            currentQuestion.partId === "part-5"
              ? "block"
              : mobileActiveTab === "questions"
              ? "block"
              : "hidden md:block"
          )}
        >
          <div className="mx-auto max-w-2xl space-y-6">
            
            {/* Header info for active part */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isListening ? <Headphones className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-ink">Answer Sheet</h2>
                  <p className="text-xs text-muted">
                    {currentGroupQuestions.length > 1
                      ? `Group Questions: ${currentGroupQuestions[0]?.questionNumber} - ${currentGroupQuestions[currentGroupQuestions.length - 1]?.questionNumber}`
                      : `Question No. ${currentQuestion.questionNumber}`}
                  </p>
                </div>
              </div>


            </div>

            {/* Vertical list of questions in the active group */}
            <div className="space-y-6">
              {currentGroupQuestions.map((q) => {
                const selectedAnswer = answers[q.id];
                const isFlagged = flags.has(q.id);
                const isCurrentlyFocused = q.id === currentQuestion.id;
                
                // Hide option text for Part 1 & 2
                const hideTexts = ["part-1", "part-2"].includes(q.partId);

                if (q.partId === "part-1" || q.partId === "part-2") {
                  return (
                    <div
                      key={q.id}
                      id={`question-card-${q.questionNumber}`}
                      onClick={() => {
                        if (isNavigationBlocked) return; // Prevent manual card clicks in Listening parts
                        if (q.id !== currentQuestion.id) {
                          setCurrentIndex(questions.indexOf(q));
                        }
                      }}
                      className={cn(
                        "rounded-2xl border p-4 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft cursor-pointer relative",
                        isCurrentlyFocused
                          ? "border-primary/50 bg-white ring-2 ring-primary/10 shadow-glow"
                          : "border-outline-variant/20 bg-white/70 hover:border-outline-variant/60 hover:bg-white"
                      )}
                    >
                      {/* Active focus indicator pill */}
                      {isCurrentlyFocused && (
                        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-primary" />
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-ink">Question {q.questionNumber}</span>
                        {isFlagged && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-sm" title="Đã đánh dấu" />
                        )}
                      </div>

                      {/* Options row */}
                      <div className="flex flex-wrap items-center gap-3">
                        {q.options.map((opt) => {
                          const isSelected = selectedAnswer === opt.label;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              disabled={submitted}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAnswer(q.id, opt.label);
                                if (!isNavigationBlocked) {
                                  setCurrentIndex(questions.indexOf(q));
                                }
                              }}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-colors duration-150 border",
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-glow"
                                  : "bg-surface-container-low text-muted border-outline-variant/40 hover:border-primary/20 hover:bg-white hover:text-primary"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right action tools */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlag(q.id);
                          }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl border transition-colors",
                            isFlagged
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "border-outline-variant/30 text-muted hover:bg-surface-container-low"
                          )}
                          title="Đánh dấu câu hỏi"
                        >
                          <Flag className={cn("h-3.5 w-3.5", isFlagged && "fill-current")} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id}
                    id={`question-card-${q.questionNumber}`}
                    onClick={() => {
                      if (q.id !== currentQuestion.id) {
                        setCurrentIndex(questions.indexOf(q));
                      }
                    }}
                    className={cn(
                      "rounded-3xl border p-5 transition-colors duration-150 relative shadow-soft",
                      isCurrentlyFocused
                        ? "border-primary/40 bg-white ring-2 ring-primary/10"
                        : "border-outline-variant/30 bg-white/70 hover:border-outline-variant/80 hover:bg-white"
                    )}
                  >
                    {/* Active focus glowing side bar */}
                    {isCurrentlyFocused && (
                      <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r bg-primary" />
                    )}

                    {/* Question Meta Row */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-ink">Question {q.questionNumber}</span>
                        {isFlagged && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            <Flag className="h-2.5 w-2.5 fill-current" />
                            Flagged
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Flag Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlag(q.id);
                          }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                            isFlagged
                              ? "bg-amber-100 text-amber-700"
                              : "text-muted hover:bg-surface-container-low"
                          )}
                          title="Đánh dấu câu này để làm sau"
                        >
                          <Flag className={cn("h-4 w-4", isFlagged && "fill-current")} />
                        </button>
                      </div>
                    </div>

                    {/* Question Stem */}
                    {/* Real TOEIC hides stem for Part 2 and Option texts for Part 1/2 */}
                    {!(q.partId === "part-2" && hideTexts) && (
                      <p className="text-sm font-black leading-relaxed text-ink mb-4">
                        {q.stem}
                      </p>
                    )}
                    {q.partId === "part-2" && hideTexts && (
                      <p className="text-xs font-bold italic text-muted mb-4">
                        * Nghe câu hỏi và chọn phản hồi đúng A, B hoặc C. (Lời thoại ẩn giống đề thi thật)
                      </p>
                    )}

                    {/* Answer options list */}
                    <div className="grid gap-2.5">
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswer === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            disabled={submitted}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAnswer(q.id, opt.label);
                              setCurrentIndex(questions.indexOf(q));
                            }}
                            className={cn(
                              "group flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-colors duration-150",
                              isSelected
                                ? "border-primary/50 bg-primary-container/15 shadow-sm"
                                : "border-outline-variant/40 bg-white/60 hover:border-primary/20 hover:bg-white"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition",
                                isSelected
                                  ? "bg-primary text-white shadow-glow"
                                  : "bg-surface-container-low text-muted group-hover:bg-primary-container/40 group-hover:text-primary"
                              )}
                            >
                              {isSelected ? <Check className="h-3.5 w-3.5" /> : opt.label}
                            </span>
                            
                            {!hideTexts && (
                              <span
                                className={cn(
                                  "text-xs font-semibold leading-relaxed",
                                  isSelected ? "text-ink" : "text-muted group-hover:text-ink"
                                )}
                              >
                                {opt.text}
                              </span>
                            )}
                            {hideTexts && (
                              <span className="text-xs font-bold text-muted group-hover:text-ink">
                                Click để chọn đáp án {opt.label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Group Navigation Controls */}
            <div className={cn("flex items-center pt-6 border-t border-outline-variant/20 pb-12", isNavigationBlocked ? "justify-end" : "justify-between")}>
              {!isNavigationBlocked && (
                <button
                  type="button"
                  disabled={questions.indexOf(currentGroupQuestions[0]) === 0}
                  onClick={goPrevGroup}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black border transition-colors",
                    questions.indexOf(currentGroupQuestions[0]) === 0
                      ? "border-outline-variant/20 text-muted/30 cursor-not-allowed"
                      : "border-outline-variant/60 bg-white hover:bg-surface-container-low text-muted"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Quay lại</span>
                </button>
              )}

              <button
                type="button"
                disabled={
                  isNavigationBlocked
                    ? (!currentGroupQuestions.every((q) => !!answers[q.id]) || currentTrackIndex === uniqueAudioUrls.length - 1)
                    : (questions.indexOf(currentGroupQuestions[currentGroupQuestions.length - 1]) === totalQuestions - 1)
                }
                onClick={() => {
                  if (isNavigationBlocked) {
                    if (currentTrackIndex < uniqueAudioUrls.length - 1) {
                      playTrack(currentTrackIndex + 1, true);
                    }
                  } else {
                    goNextGroup();
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-colors shadow-glow",
                  (isNavigationBlocked
                    ? (!currentGroupQuestions.every((q) => !!answers[q.id]) || currentTrackIndex === uniqueAudioUrls.length - 1)
                    : (questions.indexOf(currentGroupQuestions[currentGroupQuestions.length - 1]) === totalQuestions - 1))
                    ? "bg-primary/50 text-white/50 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/95"
                )}
              >
                <span>Tiếp theo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        {/* SIDEBAR: Question Nav Sheet */}
        <aside
          className={cn(
            "w-72 shrink-0 border-l border-outline-variant/20 bg-white/88 flex flex-col transition-[width] duration-150 overflow-hidden relative",
            sidebarOpen ? "translate-x-0" : "w-0 border-l-0"
          )}
        >
          {/* Header Part Jump Selectors */}
          <div className="border-b border-outline-variant/30 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">Chuyển nhanh Phần thi</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {partGroups.map((g) => {
                const isPartActive = currentPart?.partId === g.partId;
                return (
                  <button
                    key={g.partId}
                    type="button"
                    disabled={isNavigationBlocked}
                    onClick={() => goTo(g.startIndex)}
                    className={cn(
                      "rounded-lg py-1.5 text-[10px] font-black text-center transition-colors",
                      isPartActive
                        ? "bg-primary text-white shadow-glow"
                        : "bg-surface-container-highest/80 text-muted hover:bg-primary-container/40 hover:text-primary",
                      isNavigationBlocked && "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 200 Questions Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Listening Section Q1-100 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1">
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">Listening Section</span>
                <span className="text-[9px] font-bold text-muted">Q1 - Q100</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.slice(0, 100).map((q) => {
                  const isAns = !!answers[q.id];
                  const idx = questions.indexOf(q);
                  const isCurr = idx === currentIndex;
                  const isMark = flags.has(q.id);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={isNavigationBlocked}
                      onClick={() => goTo(idx)}
                      title={`Question ${q.questionNumber}`}
                      className={cn(
                        "relative flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black transition-colors",
                        isCurr
                          ? "ring-2 ring-primary ring-offset-1 bg-white text-primary"
                          : isAns
                          ? "bg-primary text-white shadow-soft"
                          : "bg-surface-container-highest/50 text-muted hover:bg-primary-container/20",
                        isNavigationBlocked && "cursor-not-allowed opacity-90"
                      )}
                    >
                      {q.questionNumber}
                      {isMark && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading Section Q101-200 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1">
                <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Reading Section</span>
                <span className="text-[9px] font-bold text-muted">Q101 - Q200</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.slice(100).map((q) => {
                  const isAns = !!answers[q.id];
                  const idx = questions.indexOf(q);
                  const isCurr = idx === currentIndex;
                  const isMark = flags.has(q.id);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={isNavigationBlocked}
                      onClick={() => goTo(idx)}
                      title={`Question ${q.questionNumber}`}
                      className={cn(
                        "relative flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black transition-colors",
                        isCurr
                          ? "ring-2 ring-primary ring-offset-1 bg-white text-primary"
                          : isAns
                          ? "bg-primary text-white shadow-soft"
                          : "bg-surface-container-highest/50 text-muted hover:bg-primary-container/20",
                        isNavigationBlocked && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {q.questionNumber}
                      {isMark && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Metrics */}
          <div className="border-t border-outline-variant/30 p-4 bg-white/40 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-[10px] font-black text-muted">
              <div className="flex flex-col items-center p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <span>{answeredCount}</span>
                <span className="font-bold text-[8px] uppercase mt-0.5">Đã làm</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <span>{flags.size}</span>
                <span className="font-bold text-[8px] uppercase mt-0.5">Đánh dấu</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-surface-container-highest text-muted">
                <span>{totalQuestions - answeredCount}</span>
                <span className="font-bold text-[8px] uppercase mt-0.5">Bỏ trống</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ──── Photo Zoom Overlay (Modal) ──── */}
      {isPhotoZoomed && (currentQuestion.partId === "part-1" || currentQuestion.image_url) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 cursor-zoom-out"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 bg-black shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentQuestion.image_url || PART1_IMAGES[currentQuestion.questionNumber] || "https://images.unsplash.com/photo-1497366216548-37526070297c"}
              alt="Zoomed Photo"
              className="max-h-[85vh] w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ──── Submit Confirm Modal ──── */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white bg-white p-7 shadow-soft">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-ink">Bạn muốn nộp bài?</h2>
            <p className="mt-2.5 text-xs leading-relaxed text-muted font-medium">
              Bạn đã làm <strong className="text-ink">{answeredCount}</strong> trên tổng số <strong className="text-ink">{totalQuestions}</strong> câu hỏi.
              {totalQuestions - answeredCount > 0 && (
                <>
                  {" "}Còn <strong className="text-red-500 font-extrabold">{totalQuestions - answeredCount}</strong> câu chưa trả lời.
                </>
              )}
              {flags.size > 0 && (
                <>
                  {" "}Và có <strong className="text-amber-600 font-extrabold">{flags.size}</strong> câu đã được đánh dấu để xem lại.
                </>
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitDialog(false)}
                className="rounded-xl border border-outline-variant/60 bg-white px-4 py-2.5 text-xs font-black text-muted transition hover:bg-surface-container-low"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-white shadow-glow transition hover:bg-primary/95"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Exit Confirm Modal ──── */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white bg-white p-7 shadow-soft">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-ink">Bạn có chắc muốn thoát?</h2>
            <p className="mt-2.5 text-xs leading-relaxed text-muted font-medium">
              Kết quả làm bài thi của bạn sẽ <strong className="text-red-600 font-extrabold">không được lưu</strong> nếu bạn thoát lúc này.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="rounded-xl border border-outline-variant/60 bg-white px-4 py-2.5 text-xs font-black text-muted transition hover:bg-surface-container-low"
              >
                Hủy (Tiếp tục làm bài)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(true);
                  router.push(`/practice/${test.id}/start`);
                }}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white shadow-glow transition hover:bg-red-700"
              >
                Đồng ý thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
