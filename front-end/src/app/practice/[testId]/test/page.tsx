"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth";
import {
  getPracticeTest,
  listPracticeQuestions,
  PracticeExamSession,
  type PracticeTest,
  type ToeicQuestion
} from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

function TestPageContent() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [questions, setQuestions] = useState<ToeicQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const partsParam = searchParams.get("parts");
  const timeParam = searchParams.get("time");
  const modeParam = searchParams.get("mode");
  const isDevMode =
    searchParams.get("dev") === "true" || searchParams.get("bypass") === "true";

  const filteredQuestions = useMemo(() => {
    if (modeParam === "full" || !partsParam) {
      return questions;
    }

    const selectedParts = partsParam.split(",");
    return questions.filter((question) => selectedParts.includes(question.partId));
  }, [questions, partsParam, modeParam]);

  const customTimeLimit = useMemo(() => {
    if (!test) {
      return undefined;
    }

    if (modeParam === "full") {
      return test.minutes;
    }

    if (timeParam !== null) {
      return Number(timeParam);
    }

    return test.minutes;
  }, [test, timeParam, modeParam]);

  useEffect(() => {
    async function loadQuestions() {
      setLoadingQuestions(true);
      setErrorMessage(null);

      try {
        const [nextTest, nextQuestions] = await Promise.all([
          getPracticeTest(params.testId),
          listPracticeQuestions(params.testId)
        ]);
        setTest(nextTest);
        setQuestions(nextQuestions);
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, "Không tải được dữ liệu câu hỏi.")
        );
      } finally {
        setLoadingQuestions(false);
      }
    }

    if (isAuthenticated) {
      loadQuestions();
    }
  }, [params.testId, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const showLoading = isLoading || (isAuthenticated && loadingQuestions);

  if (showLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-on-surface-variant">
            Đang tải đề thi
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!test || filteredQuestions.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="max-w-md rounded-3xl border border-white/70 bg-white/60 p-10 text-center shadow-glass backdrop-blur-xl">
          <h1 className="text-2xl font-extrabold text-on-surface">
            Bài thi không tồn tại
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            {errorMessage ??
              "Không tìm thấy bài thi hoặc dữ liệu câu hỏi chưa sẵn sàng."}
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
      isDevMode={isDevMode}
    />
  );
}

export default function TestPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-bold text-on-surface-variant">
              Đang tải đề thi
            </p>
          </div>
        </div>
      }
    >
      <TestPageContent />
    </Suspense>
  );
}
