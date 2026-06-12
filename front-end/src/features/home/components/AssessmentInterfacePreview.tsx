"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Headphones,
  Send,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/common/SectionHeader";

const modes = ["Listening & Reading"];

export function AssessmentInterfacePreview() {
  const [mode, setMode] = useState(modes[0]);
  const isListening = mode === "Listening & Reading";

  return (
    <section id="test-ui" className="container-shell py-20">
      <SectionHeader
        eyebrow="Test-taking experience"
        title="Màn hình làm bài tập trung, rõ timer và điều hướng câu hỏi"
        description="Giao diện làm bài trực quan với audio player, bộ đếm thời gian và điều hướng câu hỏi."
        action={
          <div className="glass-panel flex rounded-3xl p-1.5">
            {modes.map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-extrabold text-muted transition",
                  mode === item && "bg-growth text-academic-blue shadow-glow"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="soft-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 p-5">
            <div>
              <p className="font-extrabold text-growth-dark">
                {isListening ? "Part 3: Short Conversations" : "Part 5: Incomplete Sentences"}
              </p>
              <h3 className="mt-1 text-2xl font-black text-ink">
                {isListening ? "Question 42" : "Question 101"}
              </h3>
            </div>
            <div className="rounded-full bg-zinc-100 px-5 py-3 text-xl font-black text-growth-dark">
              119:51
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div
              className="min-h-[360px] rounded-[24px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0), rgba(0,122,34,0.18)), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80')"
              }}
            />

            <div className="flex flex-col gap-5">
              {isListening ? <ListeningReadingPanel /> : <ListeningReadingPanel />}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" className="flex-1">
                  <ChevronLeft size={18} /> Previous
                </Button>
                <Button variant="dark" className="flex-1">
                  Next <ChevronRight size={18} />
                </Button>
                <Button className="flex-1">
                  Submit Test <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="soft-panel p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-growth-dark">Question Map</h3>
            <span className="rounded-full bg-growth/30 px-3 py-1 text-sm font-bold text-growth-dark">
              42/100 Done
            </span>
          </div>
          <div className="mt-5 h-2 rounded-full bg-zinc-100">
            <div className="h-full w-[42%] rounded-full bg-growth-dark" />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {Array.from({ length: 65 }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                className={cn(
                  "aspect-square rounded-xl text-sm font-bold transition-colors",
                  number <= 41 && "bg-growth text-growth-dark",
                  number === 42 && "bg-white text-ink shadow-soft ring-2 ring-growth-dark",
                  number > 42 && "bg-zinc-100 text-muted"
                )}
              >
                {number}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="mt-6 w-full">
            <Flag size={18} /> Review Later
          </Button>
        </aside>
      </div>
    </section>
  );
}

function ListeningReadingPanel() {
  return (
    <>
      <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-4">
          <button className="grid h-14 w-14 place-items-center rounded-full bg-growth-dark text-white">
            <Headphones size={22} />
          </button>
          <div className="h-2 flex-1 rounded-full bg-zinc-200">
            <div className="h-full w-[46%] rounded-full bg-growth-dark" />
          </div>
          <span className="text-sm font-bold">0:45</span>
          <Volume2 size={22} />
        </div>
      </div>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-growth-dark">
          Reading prompt
        </p>
        <p className="mt-3 rounded-3xl bg-white/72 p-5 leading-7 text-ink">
          The project manager requested that all team members ______ their weekly
          reports by Friday at 5:00 PM.
        </p>
      </div>
      <div className="grid gap-3">
        {["submitted", "submit", "submitting", "submits"].map((answer, index) => (
          <button
            key={answer}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 text-left font-bold transition hover:border-growth-dark hover:bg-growth/15"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100">
              {String.fromCharCode(65 + index)}
            </span>
            {answer}
          </button>
        ))}
      </div>
    </>
  );
}

