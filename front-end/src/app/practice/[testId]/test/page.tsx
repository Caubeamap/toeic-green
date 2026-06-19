import { Suspense } from "react";
import { fetchPracticeQuestionsForCurrentUser } from "@/features/practice/services/practice-auth-server";
import { fetchPublicPracticeTest } from "@/features/practice/services/practice-server";
import { TestPageClient } from "./TestPageClient";

type TestPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export default async function TestPage({ params }: TestPageProps) {
  const { testId } = await params;
  const [initialTest, initialQuestions] = await Promise.all([
    fetchPublicPracticeTest(testId),
    fetchPracticeQuestionsForCurrentUser(testId)
  ]);

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
      <TestPageClient
        testId={testId}
        initialTest={initialTest}
        initialQuestions={initialQuestions}
      />
    </Suspense>
  );
}
