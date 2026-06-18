"use client";

import Link from "next/link";
import {
  PracticeTestSetup,
  usePracticeTestDetail,
  type PracticeTest
} from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export function PracticeStartClient({
  testId,
  initialTest
}: {
  testId: string;
  initialTest?: PracticeTest;
}) {
  // Hybrid: chi tiết public từ SSR (initialData) hiển thị ngay; tiến độ phủ lên
  // qua React Query khi đã đăng nhập. Cache RAM, không localStorage.
  const { test, isLoading, error } = usePracticeTestDetail(testId, initialTest);
  const errorMessage = error
    ? getErrorMessage(error, "Không tải được thông tin đề thi TOEIC.")
    : null;

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
