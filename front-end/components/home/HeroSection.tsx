import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/common/MaterialIcon";

const heroImage = "/images/toeic-hero-workspace.png";

const avatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEfsG3-W9GuZnB-lSVeHtzUVCq2ov-iionH0rc0cBMDP4wTmjUPnRSYcDISvkXKBG9ZKual8nKY840ObJc4ZekzMK-47okepuhPLlz1JPAHow8qXsIWZqCJ962UU0KKkNlsGv3r5CzO-5VTOPotUGQUWqWcSXLBN2wJ6FSBBmsHyD3bcKbjZGVjuFifsFo04AtUlxxVhWP_5AKJRYrZah_sa9LjE-zk9uZSGoQ-rZ2CvI5liTm3kQxCa1zyYlM_A2pEAfOdemT7lU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBDo7iTVkUJzMXHD2VFK-Ly0gbsrv8jE8OFXqBVO7mEx3ZQIXJXO3dwJqxZUWT1_ms3Ullo_n3vMkiZ684yGB_hw_yysMEjpw75lROwS5SDKgkzYdKE2J3rK9t4VieGrsgwBNRTpbRstVxiUcPpYlQqacpE9o7-jca46on6SMtQEZ49hgq_JCNTzOQlBlmlWn7i6PMHv2RNI3y0qARj5sKR3D70NDPtkPJVEeSvWotsduGx_dyy4aor426ruLnvC3qakl-lV57jbVw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAdYvtyELgSmiENQC0E96w9tLo66bwNWygDUpf-Z6is3RsjNuJnZN7lcfGVdZPcPPqxZpr03p6hfU0Whr-4v2eInrpCNxBE-yb0sN-Yk-Ts9mxA5-AGgBywhBy8UW6qeYq5ntx9hTPxeROOurKS0qHxVhSdymcUs9vxdAbP0vdgcxhVNq5C8_vaqUkiKcs9C7QK95ywFokZdz2j7x_bTmCUI3ITey3qMDA-6Qcdtx91ulvrc8A6pCscevD-jojUc5bFjSJCIZ4BNmw"
];

export function HeroSection() {
  return (
    <section className="container-shell relative mb-32 grid items-center gap-12 md:grid-cols-2">
      <div className="space-y-8">
        <div className="glass-card interactive-surface inline-flex items-center gap-2 rounded-full border-primary/20 px-4 py-2 text-primary">
          <MaterialIcon name="auto_awesome" className="h-[18px] w-[18px]" filled />
          <span className="text-label-md font-semibold uppercase tracking-wider">
            Enhance Learning English skill
          </span>
        </div>

        <h1 className="max-w-xl text-display-lg-mobile font-extrabold leading-[1.1] text-on-surface md:text-display-lg">
          Master TOEIC with <br />
          <span className="accent-text">Smart Practice</span>
        </h1>

        <p className="max-w-xl text-body-lg text-on-surface-variant">
          Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích chi
          tiết sau mỗi bài test để nâng cao trình độ nhanh chóng.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/practice"
            className="button-sheen inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary-container px-8 py-4 text-headline-md font-bold text-on-primary-container shadow-soft hover:bg-primary-fixed-dim"
          >
            Bắt đầu luyện thi
            <MaterialIcon name="arrow_forward" className="h-5 w-5" />
          </Link>
          <Link
            href="/practice"
            className="button-sheen glass-card inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-8 py-4 text-headline-md font-bold text-on-surface hover:bg-white/60"
          >
            Khám phá bài test
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4">
          <div className="flex -space-x-3">
            {avatars.map((src) => (
              <Image
                key={src}
                src={src}
                alt="TOEIC Green student"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ))}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-secondary text-[12px] font-bold text-on-secondary">
              12k+
            </span>
          </div>
          <p className="text-label-md font-semibold text-on-surface-variant">
            Hơn 12,000 học viên đã bắt đầu
          </p>
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
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div
            className="glass-card animate-float-soft absolute right-6 top-6 rounded-xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <MaterialIcon name="trending_up" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-label-md font-semibold text-primary">Score Goal</p>
                <p className="text-headline-md font-bold text-on-surface">950+</p>
              </div>
            </div>
          </div>

          <div className="glass-card animate-float-soft float-delay absolute bottom-4 left-4 w-[min(220px,calc(100%-2rem))] rounded-xl border border-white/60 bg-white/80 p-4 text-on-surface shadow-soft sm:-bottom-4 sm:-left-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-label-sm font-bold text-on-surface">Live Progress</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div className="progress-sheen h-full w-3/4 rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-snug text-on-surface-variant">
              Luyện tập mỗi ngày, điểm số bay cao!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
