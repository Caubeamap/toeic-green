"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import {
  getPracticeTest,
  getPracticeTestWithProgress,
  PracticeTestSetup,
  type PracticeTest
} from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export function PracticeStartClient({ testId }: { testId: string }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [test, setTest] = useState<PracticeTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Đọc trực tiếp localStorage để phát hiện sớm phiên đăng nhập cũ chưa được khôi phục.
    const hasStoredUser =
      typeof window !== "undefined" && !!localStorage.getItem("toeic-green-auth");

    // Chỉ chờ khôi phục phiên khi đúng là người dùng cũ đang được hydrate, để khách
    // vãng lai / lần tải nguội vẫn nhận ngay dữ liệu đề thi công khai mà không phải
    // đợi refresh token.
    if (isAuthLoading && hasStoredUser) {
      return;
    }

    let cancelled = false;

    async function loadTest() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextTest = isAuthenticated
          ? await getPracticeTestWithProgress(testId)
          : await getPracticeTest(testId);

        if (!cancelled) {
          setTest(nextTest);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, "Không tải được thông tin đề thi TOEIC.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTest();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthLoading, testId]);

  if (isLoading) {
    return (
      <section className="container-shell py-24">
        <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
          Đang tải đề thi
        </div>
      </section>
    );
  }

  if (errorMessage || !test) {
    return (
      <section className="container-shell py-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-soft">
          <h1 className="text-2xl font-extrabold text-red-700">
            Không tìm thấy đề thi
          </h1>
          <p className="mt-3 text-sm font-semibold text-red-700">
            {errorMessage ?? "Đề thi này chưa sẵn sàng."}
          </p>
          <Link
            href="/practice"
            className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-primary/90"
          >
            Quay về danh sách
          </Link>
        </div>
      </section>
    );
  }

  return <PracticeTestSetup test={test} />;
}
