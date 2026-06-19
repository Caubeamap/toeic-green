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
      <section className="container-shell py-24 animate-pulse">
        {/* Back button skeleton */}
        <div className="h-4 w-28 rounded bg-slate-200" />
        
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {/* Test Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="h-8 w-64 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-40 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded bg-slate-100" />
            </div>
            
            {/* Tabs */}
            <div className="mt-6 flex gap-4 border-b border-zinc-200 pb-2">
              <div className="h-6 w-20 rounded bg-slate-200" />
              <div className="h-6 w-28 rounded bg-slate-200" />
              <div className="h-6 w-24 rounded bg-slate-200" />
            </div>
            
            {/* Setup panel */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
              <div className="h-6 w-44 rounded bg-slate-200" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-14 rounded-xl bg-slate-100" />
                <div className="h-14 rounded-xl bg-slate-100" />
                <div className="h-14 rounded-xl bg-slate-100" />
                <div className="h-14 rounded-xl bg-slate-100" />
              </div>
              <div className="mt-6 h-10 w-full rounded-xl bg-slate-200" />
            </div>
          </div>
          
          {/* Sidebar info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="h-6 w-32 rounded bg-slate-200" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
              </div>
            </div>
          </div>
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
