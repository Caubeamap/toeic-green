"use client";

import { ArrowRight, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBJhz6O6RoTuBn1RrhYE6Q7vrhtpNV9kApubgEq09PMxxnMZHH3lyxI5hNmd_pO2ph_EyDuvV2ARwKI84U0-Couso1aeiovsKKqGJnIVLVoMW1BW5m8Uze2Y2eNsHiqwoe-9HWMh6gOwjKIR-y2W26qwrxqfK_Far6JiS7Du2vMnTYQNlUlMn4gthJamUIpiHSbyK6nLgG_FXR5t9GZm4hW-X8cnERuxCcexrXinfJxVr2XH2jenAj2N83YPM6Lj2Kdj42wijH-DOk";

const avatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEfsG3-W9GuZnB-lSVeHtzUVCq2ov-iionH0rc0cBMDP4wTmjUPnRSYcDISvkXKBG9ZKual8nKY840ObJc4ZekzMK-47okepuhPLlz1JPAHow8qXsIWZqCJ962UU0KKkNlsGv3r5CzO-5VTOPotUGQUWqWcSXLBN2wJ6FSBBmsHyD3bcKbjZGVjuFifsFo04AtUlxxVhWP_5AKJRYrZah_sa9LjE-zk9uZSGoQ-rZ2CvI5liTm3kQxCa1zyYlM_A2pEAfOdemT7lU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBDo7iTVkUJzMXHD2VFK-Ly0gbsrv8jE8OFXqBVO7mEx3ZQIXJXO3dwJqxZUWT1_ms3Ullo_n3vMkiZ684yGB_hw_yysMEjpw75lROwS5SDKgkzYdKE2J3rK9t4VieGrsgwBNRTpbRstVxiUcPpYlQqacpE9o7-jca46on6SMtQEZ49hgq_JCNTzOQlBlmlWn7i6PMHv2RNI3y0qARj5sKR3D70NDPtkPJVEeSvWotsduGx_dyy4aor426ruLnvC3qakl-lV57jbVw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAdYvtyELgSmiENQC0E96w9tLo66bwNWygDUpf-Z6is3RsjNuJnZN7lcfGVdZPcPPqxZpr03p6hfU0Whr-4v2eInrpCNxBE-yb0sN-Yk-Ts9mxA5-AGgBywhBy8UW6qeYq5ntx9hTPxeROOurKS0qHxVhSdymcUs9vxdAbP0vdgcxhVNq5C8_vaqUkiKcs9C7QK95ywFokZdz2j7x_bTmCUI3ITey3qMDA-6Qcdtx91ulvrc8A6pCscevD-jojUc5bFjSJCIZ4BNmw"
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(142,245,136,0.42),transparent_28%),radial-gradient(circle_at_92%_18%,rgba(166,181,255,0.32),transparent_28%),linear-gradient(180deg,#fbf9f8_0%,#fbf9f8_82%,rgba(255,255,255,0)_100%)]" />

      <div className="container-shell relative grid min-h-[660px] items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-growth/35 bg-white/48 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-growth-dark shadow-soft backdrop-blur-xl">
            <Sparkles size={16} fill="currentColor" />
            AI-powered learning
          </div>

          <h1 className="mt-8 max-w-xl text-4xl font-black leading-[1.08] text-ink md:text-5xl">
            Master TOEIC with <br />
            <span className="text-growth-dark">Smart Practice</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-muted md:text-lg">
            Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích
            chi tiết sau mỗi bài test để nâng cao trình độ nhanh chóng.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/practice"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-growth px-8 py-4 text-base font-black text-academic-blue shadow-glow transition duration-200 hover:-translate-y-0.5"
            >
              Bắt đầu luyện thi <ArrowRight size={20} />
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white/58 px-8 py-4 text-base font-black text-ink shadow-soft backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/80"
            >
              <PlayCircle size={20} /> Khám phá bài test
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <div className="flex -space-x-3">
              {avatars.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt="TOEIC Green student"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-soft"
                />
              ))}
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-academic-blue text-xs font-black text-white shadow-soft">
                12k+
              </span>
            </div>
            <p className="text-sm font-bold text-muted">
              Hơn 12,000 học viên đã bắt đầu
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="relative pb-10"
        >
          <div className="absolute -right-10 -top-8 h-[88%] w-[88%] rounded-[34px] bg-secondary-container/22" />
          <div className="glass-panel relative z-10 rotate-2 rounded-[32px] p-2.5 shadow-glass">
            <div className="overflow-hidden rounded-[25px]">
              <Image
                src={heroImage}
                alt="Laptop showing TOEIC Green practice interface"
                width={760}
                height={570}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div className="animate-float-soft absolute right-6 top-6 rounded-2xl border border-white/60 bg-white/78 p-4 shadow-soft backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-growth/40 text-growth-dark">
                  <TrendingUp size={20} />
                </span>
                <div>
                  <p className="text-xs font-black text-growth-dark">Score Goal</p>
                  <p className="text-2xl font-black text-ink">950+</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-14 -left-8 max-w-[260px] rounded-2xl border border-white/80 bg-white/82 p-4 shadow-glass backdrop-blur-2xl sm:-bottom-14">
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-growth-dark opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-growth-dark" />
                </span>
                <span className="text-xs font-black text-ink">Live Progress</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/90">
                <div className="h-full w-3/4 rounded-full bg-growth-dark" />
              </div>
              <p className="mt-2 text-[12px] font-extrabold leading-5 text-ink/80">
                Luyện tập mỗi ngày, điểm số bay cao!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
