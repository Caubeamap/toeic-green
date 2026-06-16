"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth";
import { getLatestPracticeAttemptResult } from "@/features/practice";
import { getErrorMessage } from "@/lib/api";

export default function LatestResultPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestResult() {
      try {
        const result = await getLatestPracticeAttemptResult(params.testId);

        if (!cancelled) {
          router.replace(`/practice/${params.testId}/results/${result.attempt.id}`);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, "Không tìm thấy kết quả mới nhất.")
          );
        }
      }
    }

    if (isAuthenticated) {
      loadLatestResult();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, params.testId, router]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#effaf0_0%,#fbf9f8_44%),radial-gradient(circle_at_100%_20%,#eef4ff_0%,#fbf9f8_36%)] pt-32">
        <section className="container-shell pb-16">
          <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
            {errorMessage ? (
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
              "Đang mở kết quả mới nhất từ backend..."
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
