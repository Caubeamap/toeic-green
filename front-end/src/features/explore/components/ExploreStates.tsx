import Link from "next/link";
import { ArrowLeft, CheckCircle2, Library, Loader2, RotateCcw } from "lucide-react";
import type { ExploreCollection } from "../types";

export function CollectionRouteMessage({
  title,
  description,
  isLoading = false,
  onBack
}: {
  title: string;
  description: string;
  isLoading?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-soft">
      {isLoading ? (
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      ) : (
        <Library className="mx-auto h-10 w-10 text-slate-300" />
      )}
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {onBack ? (
        <Link
          href="/explore"
          onClick={onBack}
          prefetch={false}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-[#005d16]"
        >
          <ArrowLeft size={16} />
          Quay lại Explore
        </Link>
      ) : null}
    </div>
  );
}

export function CollectionGridSkeleton() {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[232px] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] animate-pulse"
        >
          <div className="h-5 w-3/4 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-8 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-14 flex justify-between">
            <div className="h-8 w-24 rounded bg-slate-100" />
            <div className="h-10 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WordListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] animate-pulse"
        >
          <div className="h-5 w-44 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Library className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export function ReviewCompleted({
  collection,
  knownWords,
  backHref,
  isResettingKnown,
  onResetKnown,
  onClose
}: {
  collection: ExploreCollection;
  knownWords: number;
  backHref: string;
  isResettingKnown: boolean;
  onResetKnown: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-ink">
          Bạn đã học hết bộ này 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Toàn bộ {knownWords} từ của “{collection.title}” đã được đánh dấu “Đã
          biết”. Bạn có thể ôn lại từ đầu để củng cố trí nhớ.
        </p>

        <button
          type="button"
          onClick={onResetKnown}
          disabled={isResettingKnown}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isResettingKnown ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RotateCcw size={16} />
          )}
          Ôn lại từ đã biết
        </button>
      </div>
    </div>
  );
}

export function ReviewLoading({
  backHref,
  onClose
}: {
  backHref: string;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={backHref}
        onClick={onClose}
        prefetch={false}
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-muted transition hover:border-primary/35 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Xem danh sách từ
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm font-bold text-muted">
          Đang tải dữ liệu flashcard...
        </p>
      </div>
    </div>
  );
}
