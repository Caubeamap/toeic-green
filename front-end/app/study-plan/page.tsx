import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, Clock3, Target } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SectionHeader } from "@/components/common/SectionHeader";

const weeks = [
  {
    title: "Week 1 · Foundation",
    focus: "Part 1-2 Listening, Part 5 grammar traps",
    tasks: ["2 mini tests", "80 vocabulary notes", "Daily 20-minute review"]
  },
  {
    title: "Week 2 · Accuracy",
    focus: "Part 3-4 conversations, business email vocabulary",
    tasks: ["1 full listening set", "Speaking response drills", "Error review"]
  },
  {
    title: "Week 3 · Speed",
    focus: "Part 6-7 scanning and time management",
    tasks: ["2 reading simulations", "Contract and meeting tags", "Timed review"]
  },
  {
    title: "Week 4 · Simulation",
    focus: "Full test strategy and final weak-point review",
    tasks: ["2 full tests", "Score analysis", "Next target plan"]
  }
];

export default function StudyPlanPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        <section className="container-shell pb-20">
          <SectionHeader
            eyebrow="Study plan"
            title="Lộ trình học TOEIC 4 tuần, tập trung vào phần yếu"
            description="Trang này tách riêng kế hoạch học để sau này có thể thêm lịch cá nhân, reminder, target score và đề xuất tự động theo kết quả làm bài."
            action={
              <Link
                href="/practice"
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-growth px-5 py-3 font-black text-academic-blue shadow-glow"
              >
                Start practice <ArrowRight size={18} />
              </Link>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-[28px] bg-academic-blue p-7 text-white shadow-glass">
              <CalendarCheck size={30} className="text-growth" />
              <h2 className="mt-5 text-3xl font-black">Target 850+</h2>
              <p className="mt-3 leading-7 text-white/78">
                Kế hoạch ưu tiên Reading Part 5-7 và duy trì listening streak mỗi
                ngày để tăng điểm ổn định.
              </p>
              <div className="mt-7 space-y-3">
                <PlanMetric icon={Target} label="Target score" value="850+" />
                <PlanMetric icon={Clock3} label="Daily time" value="45 mins" />
                <PlanMetric icon={CheckCircle2} label="Weekly tests" value="3 sets" />
              </div>
            </aside>

            <div className="grid gap-5 md:grid-cols-2">
              {weeks.map((week) => (
                <article
                  key={week.title}
                  className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-soft"
                >
                  <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-growth-dark">
                    {week.title}
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-ink">{week.focus}</h3>
                  <div className="mt-6 space-y-3">
                    {week.tasks.map((task) => (
                      <div key={task} className="flex items-center gap-3 rounded-2xl bg-growth/12 p-3">
                        <CheckCircle2 className="shrink-0 text-growth-dark" size={20} />
                        <span className="font-bold text-ink">{task}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PlanMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/12 p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-growth" size={20} />
        <span className="font-bold text-white/78">{label}</span>
      </div>
      <span className="font-black text-growth">{value}</span>
    </div>
  );
}
