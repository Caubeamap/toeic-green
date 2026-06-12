"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth";
import { getPracticeTestById, getQuestionsForTest, type ToeicQuestion, PracticeExamSession } from "@/features/practice";

function TestPageContent() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const test = getPracticeTestById(params.testId);
  
  const [questions, setQuestions] = useState<ToeicQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const partsParam = searchParams.get("parts");
  const timeParam = searchParams.get("time");
  const modeParam = searchParams.get("mode");

  const filteredQuestions = useMemo(() => {
    if (modeParam === "full" || !partsParam) {
      return questions;
    }
    const selectedParts = partsParam.split(",");
    return questions.filter((q) => selectedParts.includes(q.partId));
  }, [questions, partsParam, modeParam]);

  const customTimeLimit = useMemo(() => {
    if (modeParam === "full") {
      return test?.minutes;
    }
    if (timeParam !== null) {
      return Number(timeParam);
    }
    return test?.minutes;
  }, [test, timeParam, modeParam]);

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
        // Fallback to static mock data
        const staticQs = getQuestionsForTest(params.testId);
        setQuestions(staticQs);
      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    
    if (isAuthenticated) {
      loadQuestions();
    }
  }, [params.testId, isAuthenticated]);

  /* Redirect to login if not authenticated */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        `/login?next=${encodeURIComponent(`/practice/${params.testId}/start`)}`
      );
    }
  }, [isLoading, isAuthenticated, params.testId, router]);

  const showLoading = isLoading || (isAuthenticated && loadingQuestions);

  if (showLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-on-surface-variant">
            Đang tải bài thi...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!test || questions.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="max-w-md rounded-3xl border border-white/70 bg-white/60 p-10 text-center shadow-glass backdrop-blur-xl">
          <h1 className="text-2xl font-extrabold text-on-surface">
            Bài thi không tồn tại
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Không tìm thấy bài thi hoặc dữ liệu câu hỏi chưa sẵn sàng.
          </p>
          <button
            type="button"
            onClick={() => router.push("/practice")}
            className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-primary/90"
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <PracticeExamSession
      test={test}
      questions={filteredQuestions}
      customTimeLimit={customTimeLimit}
    />
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-on-surface-variant">
            Đang tải cấu hình bài thi...
          </p>
        </div>
      </div>
    }>
      <TestPageContent />
    </Suspense>
  );
}
