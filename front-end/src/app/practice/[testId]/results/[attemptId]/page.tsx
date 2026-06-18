"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth";
import { PracticeResultReview, useAttemptResult } from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export default function AttemptResultPage() {
  const params = useParams<{ attemptId: string; testId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Kết quả qua React Query (cache RAM). Vào ngay sau khi nộp bài là tức thì vì
  // useSubmitAttempt đã seed sẵn cache cho đúng attemptId.
  const {
    data: result,
    isLoading,
    error
  } = useAttemptResult(params.testId, params.attemptId);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Hiển thị giao diện kết quả ngay khi có dữ liệu (bỏ qua isAuthLoading)
  if (result) {
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <PracticeResultReview attemptResult={result} />
      </Suspense>
    );
  }

  const errorMessage = error
    ? getErrorMessage(error, "Không tải được kết quả làm bài.")
    : null;
  const showLoading = isAuthLoading || !isAuthenticated || isLoading;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_36%)] pt-32">
        <section className="container-shell pb-16">
          {showLoading ? (
            <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
              Đang tải kết quả
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-soft">
              <h1 className="text-2xl font-extrabold text-red-700">
                Không tìm thấy kết quả
              </h1>
              <p className="mt-3 text-sm font-semibold text-red-700">
                {errorMessage ??
                  "Kết quả này không tồn tại hoặc không thuộc tài khoản hiện tại."}
              </p>
              <Link
                href="/practice"
                className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-primary/90"
              >
                Quay về danh sách
              </Link>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
