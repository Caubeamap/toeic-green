"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth";
import {
  PracticeExamSession,
  practiceTimeStorageKey,
  usePracticeQuestions,
  usePracticeTest,
  type PracticeTest,
  type ToeicQuestion
} from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export function TestPageClient({
  initialQuestions,
  initialTest,
  testId
}: {
  initialQuestions?: ToeicQuestion[];
  initialTest?: PracticeTest;
  testId: string;
}) {
  const params = useParams<{ testId: string }>();
  const resolvedTestId = testId || params.testId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isApiReady, isLoading } = useAuth();

  // Thời gian thi do trang setup ghi vào sessionStorage (không nằm trên URL nên
  // người dùng không sửa được giữa bài). Đọc đồng bộ ở lần render đầu — phần thi
  // chỉ hiển thị sau khi qua loading gate nên không gây hydration mismatch.
  const [storedTimeLimit] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(practiceTimeStorageKey(resolvedTestId));
  });

  const testQuery = usePracticeTest(resolvedTestId, initialTest);
  const questionsQuery = usePracticeQuestions(
    resolvedTestId,
    isAuthenticated,
    initialQuestions
  );
  const test = testQuery.data ?? null;
  const questions = useMemo(
    () => questionsQuery.data ?? [],
    [questionsQuery.data]
  );
  const loadingQuestions = questionsQuery.isLoading;
  const errorMessage =
    testQuery.error || questionsQuery.error
      ? getErrorMessage(
          testQuery.error ?? questionsQuery.error,
          "Không tải được dữ liệu câu hỏi."
        )
      : null;

  const partsParam = searchParams.get("parts");
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

    if (storedTimeLimit !== null) {
      return Number(storedTimeLimit);
    }

    return test.minutes;
  }, [test, storedTimeLimit, modeParam]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const showLoading =
    isLoading || (isAuthenticated && (!isApiReady || loadingQuestions));

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
