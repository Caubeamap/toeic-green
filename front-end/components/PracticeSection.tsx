"use client";

import { useMemo, useState } from "react";
import { filters, tests } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/SectionHeading";
import { TestCard } from "@/components/TestCard";

export function PracticeSection() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const filteredTests = useMemo(() => {
    if (activeFilter === "All") return tests;
    if (activeFilter === "Completed") {
      return tests.filter((test) => test.status === "Completed");
    }
    if (activeFilter === "New Test") {
      return tests.filter((test) => test.status === "New Test");
    }
    if (activeFilter === "Listening & Reading") {
      return tests.filter((test) => test.type === "Listening + Reading");
    }
    return tests.filter((test) => test.type === "Speaking + Writing");
  }, [activeFilter]);

  return (
    <section id="practice" className="bg-white/56 py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Practice tests"
          title="Bộ đề TOEIC rõ tiến độ, dễ bắt đầu lại"
          description="Card đề thi hiển thị đúng loại đề, thời lượng, số câu, độ khó và tiến độ đã làm để người học ra quyết định nhanh."
          action={
            <div className="glass-panel flex max-w-full gap-1 overflow-x-auto rounded-3xl p-1.5">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-extrabold text-muted transition",
                    activeFilter === filter && "bg-white text-growth-dark shadow-soft"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
          <div className="grid min-h-[460px] place-items-center rounded-[28px] border border-dashed border-growth-dark/30 bg-white/50 p-8 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-growth text-3xl font-light text-academic-blue">
                +
              </div>
              <h3 className="mt-5 text-2xl font-black text-ink">Unlock More Tests</h3>
              <p className="mx-auto mt-3 max-w-xs leading-7 text-muted">
                Chuẩn bị sẵn layout cho thư viện 50+ đề full simulation khi có backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
