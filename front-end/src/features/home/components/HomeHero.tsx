import Image from "next/image";
import Link from "next/link";
import { MaterialSymbolIcon } from "@/components/common/MaterialSymbolIcon";

const heroImage = "/images/toeic-hero-workspace.webp";

export function HomeHero() {
  return (
    <section className="container-shell relative mb-32 grid items-center gap-12 md:grid-cols-2">
      <div className="space-y-8">
        <div className="glass-card interactive-surface inline-flex items-center gap-2 rounded-full border-primary/20 px-4 py-2 text-primary">
          <MaterialSymbolIcon name="auto_awesome" className="h-[18px] w-[18px]" filled />
          <span className="text-label-md font-semibold uppercase tracking-wider">
            Luyện thi TOEIC Online
          </span>
        </div>

        <h1 className="max-w-xl text-display-lg-mobile font-extrabold leading-[1.2] text-on-surface md:text-display-lg md:leading-[1.15]">
          Luyện đề TOEIC —
          <span className="accent-text block mt-3 md:mt-4">Giải thích chi tiết</span>
        </h1>

        <p className="max-w-xl text-body-lg text-on-surface-variant">
          Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích chi
          tiết sau mỗi bài test để hiểu rõ từng câu sai.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/practice"
            className="button-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3 text-body-md font-bold text-on-primary-container shadow-soft hover:bg-primary-fixed-dim whitespace-nowrap"
          >
            Bắt đầu luyện thi
            <MaterialSymbolIcon name="arrow_forward" className="h-5 w-5" />
          </Link>
          <Link
            href="/practice"
            className="button-sheen glass-card inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-body-md font-bold text-on-surface hover:bg-white/60 whitespace-nowrap"
          >
            Khám phá bài test
          </Link>
        </div>

      </div>

      <div className="relative">
        <div className="absolute -right-10 -top-10 -z-0 h-full w-full -rotate-3 rounded-[28px] bg-secondary-container/20" />
        <div className="glass-card relative z-10 rotate-3 rounded-[28px] p-2 shadow-soft">
          <div className="overflow-hidden rounded-[24px]">
            <Image
              src={heroImage}
              alt="Laptop showing TOEIC Green practice interface"
              width={760}
              height={570}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div
            className="glass-card animate-float-soft absolute right-6 top-6 rounded-xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <MaterialSymbolIcon name="trending_up" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-label-md font-semibold text-primary">Mục tiêu</p>
                <p className="text-headline-md font-bold text-on-surface">850+</p>
              </div>
            </div>
          </div>

          <div className="glass-card animate-float-soft float-delay absolute bottom-4 left-4 w-[min(220px,calc(100%-2rem))] rounded-xl border border-white/60 bg-white/80 p-4 text-on-surface shadow-soft sm:-bottom-4 sm:-left-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-label-sm font-bold text-on-surface">Tiến trình</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div className="progress-sheen h-full w-3/4 rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-snug text-on-surface-variant">
              75% mục tiêu tuần này
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
