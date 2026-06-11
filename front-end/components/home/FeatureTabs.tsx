"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { featureTabs } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/common/SectionHeading";

export function FeatureTabs() {
  const [activeId, setActiveId] = useState(featureTabs[0].id);
  const active = featureTabs.find((tab) => tab.id === activeId) ?? featureTabs[0];

  return (
    <section className="container-shell py-20">
      <SectionHeading
        eyebrow="Core workspace"
        title="Một nền tảng cho toàn bộ hành trình TOEIC"
        description="Các tab được thiết kế như khu vực thao tác chính, chuyển mượt và đủ rõ active state để người học không bị lạc trong luồng ôn luyện."
      />

      <div className="glass-panel overflow-x-auto rounded-[28px] p-2">
        <div className="flex min-w-max gap-2">
          {featureTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold text-muted transition",
                activeId === tab.id && "text-academic-blue"
              )}
            >
              {activeId === tab.id ? (
                <span className="absolute inset-0 rounded-full bg-growth shadow-glow" />
              ) : null}
              <tab.icon className="relative" size={18} />
              <span className="relative whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="soft-panel p-7">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-growth text-academic-blue shadow-glow">
            <active.icon size={26} />
          </div>
          <h3 className="mt-6 text-3xl font-black text-ink">{active.title}</h3>
          <p className="mt-4 text-base leading-7 text-muted">{active.description}</p>
          <div className="mt-7 inline-flex rounded-full bg-academic-blue px-4 py-2 text-sm font-extrabold text-white">
            {active.stat}
          </div>
        </div>

        <div className="soft-panel p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Audio player hiện đại",
              "Question map và timer",
              "Giải thích đúng/sai rõ ràng",
              "Tag từ vựng theo chủ đề"
            ].map((item) => (
              <div
                key={item}
                className="flex min-h-24 items-center gap-4 rounded-3xl border border-emerald-100 bg-white/76 p-5"
              >
                <CheckCircle2 className="shrink-0 text-growth-dark" size={24} />
                <span className="font-bold text-ink">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-3xl bg-gradient-to-br from-growth via-soft-mint to-white p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-growth-dark">
              Active preview
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/72 px-4 py-2 text-sm font-bold text-ink">
                {active.label}
              </span>
              <span className="rounded-full bg-academic-blue px-4 py-2 text-sm font-bold text-white">
                Ready to practice
              </span>
              <span className="rounded-full bg-white/72 px-4 py-2 text-sm font-bold text-growth-dark">
                Smart explanation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
