"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth";
import { practiceKeys, useLatestAttemptResult } from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export default function LatestResultPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const {
    isAuthenticated,
    isApiReady,
    isLoading: isAuthLoading
  } = useAuth();
  const { data, error } = useLatestAttemptResult(params.testId);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Có kết quả mới nhất → seed cache theo attemptId (để trang đích mở tức thì) rồi
  // điều hướng sang trang kết quả chi tiết.
  useEffect(() => {
    if (data) {
      qc.setQueryData(practiceKeys.attempt(params.testId, data.attempt.id), data);
      router.replace(`/practice/${params.testId}/results/${data.attempt.id}`);
    }
  }, [data, params.testId, qc, router]);

  const errorMessage = error
    ? getErrorMessage(error, "Không tìm thấy kết quả mới nhất.")
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_36%)] pt-32">
        <section className="container-shell pb-16">
          <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
            {isAuthLoading || (isAuthenticated && !isApiReady) ? (
              "\u0110ang m\u1edf k\u1ebft qu\u1ea3 m\u1edbi nh\u1ea5t..."
            ) : errorMessage ? (
              <>
                <p className="font-semibold text-red-700">{errorMessage}</p>
                <Link
                  href={`/practice/${params.testId}/start`}
                  className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-primary/90"
                >
                  Quay lại trang chuẩn bị thi
                </Link>
              </>
            ) : (
              "Đang mở kết quả mới nhất..."
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
