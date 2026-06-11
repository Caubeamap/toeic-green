import { BookOpen, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { resultCards } from "@/lib/data";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function TestResult() {
  return (
    <section id="results" className="container-shell py-20">
      <SectionHeading
        eyebrow="Result & explanation"
        title="Kết quả sau bài làm phải biến lỗi sai thành bài học"
        description="Điểm số, tỷ lệ đúng sai, câu sai và lời giải được gom lại trong một màn hình dễ đọc, có highlight rõ đáp án đúng và sai."
      />

      <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <div className="soft-panel p-6">
            <div className="grid gap-6 sm:grid-cols-[170px_1fr]">
              <div className="relative grid aspect-square place-items-center rounded-full bg-[conic-gradient(#007a22_0_82%,#edf1ed_82%_100%)] p-4">
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-3xl font-black text-growth-dark">820</p>
                    <p className="text-sm font-bold uppercase text-muted">Est. score</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-growth-dark">
                  Full Practice Test #12
                </h3>
                <p className="mt-3 leading-7 text-muted">
                  Great job. You improved by 45 points compared to your last
                  attempt. Focus on Reading Comprehension to break the 850 barrier.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {resultCards.map((card) => (
                    <div
                      key={card.label}
                      className={cn(
                        "rounded-2xl border p-4",
                        card.tone === "green" && "border-growth/70 bg-growth/22",
                        card.tone === "red" && "border-red-200 bg-red-50",
                        card.tone === "blue" && "border-blue-200 bg-blue-50"
                      )}
                    >
                      <p className="text-sm font-bold text-muted">{card.label}</p>
                      <p className="mt-1 text-xl font-black text-ink">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="soft-panel p-6">
            <h3 className="font-black text-growth-dark">Error List</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[12, 24, 45, 51, 67, 89, 92, 104].map((item, index) => (
                <button
                  key={item}
                  className={cn(
                    "rounded-xl border px-4 py-3 font-black",
                    index < 2
                      ? "border-danger bg-danger text-white"
                      : "border-red-300 bg-red-50 text-danger"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ExplanationCard />
          <div className="rounded-[28px] border border-red-300 bg-white/84 p-6 shadow-soft">
            <p className="text-sm font-black text-danger">Question 24 · Listening Part 2</p>
            <h3 className="mt-3 text-2xl font-black text-ink">Question-Response</h3>
            <div className="mt-5 flex items-center gap-4 rounded-3xl bg-zinc-50 p-4">
              <button className="grid h-11 w-11 place-items-center rounded-full bg-growth-dark text-white">
                <BookOpen size={19} />
              </button>
              <div className="h-2 flex-1 rounded-full bg-zinc-200">
                <div className="h-full w-[36%] rounded-full bg-growth-dark" />
              </div>
              <span className="text-sm font-bold text-muted">0:04 / 0:12</span>
            </div>
            <p className="mt-5 italic text-muted">Scroll to view full explanation...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplanationCard() {
  return (
    <article className="rounded-[28px] border border-red-300 bg-white/84 p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-danger">Question 12 · Reading Part 5</p>
          <h3 className="mt-3 text-3xl font-black text-ink">Incomplete Sentence</h3>
        </div>
        <Button variant="secondary" className="hidden sm:inline-flex">Save</Button>
      </div>
      <p className="mt-6 rounded-3xl bg-zinc-50 p-5 leading-7 text-ink">
        The project manager requested that all team members ______ their weekly
        reports by Friday at 5:00 PM.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Answer label="A" text="submitted" wrong />
        <Answer label="B" text="submit" correct />
        <Answer label="C" text="submitting" />
        <Answer label="D" text="submits" />
      </div>
      <div className="mt-6 rounded-3xl border-l-4 border-growth-dark bg-growth/12 p-5">
        <div className="flex items-center gap-2 font-black text-growth-dark">
          <Lightbulb size={20} /> Explanation
        </div>
        <p className="mt-3 leading-7 text-ink">
          Câu này yêu cầu subjunctive mood. Sau các động từ diễn tả yêu cầu như
          request, suggest, recommend, mệnh đề theo sau dùng động từ nguyên mẫu,
          nên “submit” là đáp án đúng.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Submit (v)", "To give to someone in authority."],
          ["Request (v)", "The act of asking for something."],
          ["Grammar Tag", "Subjunctive · Verbs"]
        ].map(([title, copy]) => (
          <div key={title} className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
            <p className="font-black text-growth-dark">{title}</p>
            <p className="mt-1 text-sm text-muted">{copy}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Answer({
  label,
  text,
  correct,
  wrong
}: {
  label: string;
  text: string;
  correct?: boolean;
  wrong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border bg-white p-4",
        correct && "border-growth-dark bg-growth/16",
        wrong && "border-red-300 bg-red-50"
      )}
    >
      <div className="flex items-center gap-3 font-bold">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-sm",
            correct && "bg-growth-dark text-white",
            wrong && "bg-danger text-white"
          )}
        >
          {label}
        </span>
        {text}
      </div>
      {correct ? <CheckCircle2 className="text-growth-dark" size={20} /> : null}
      {wrong ? <XCircle className="text-danger" size={20} /> : null}
    </div>
  );
}
