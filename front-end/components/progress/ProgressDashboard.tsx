import { ArrowRight, PlayCircle, TrendingUp } from "lucide-react";
import { nextLessons, progressStats } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/common/SectionHeading";

export function ProgressDashboard() {
  return (
    <section id="dashboard" className="bg-gradient-to-b from-white to-soft-mint/40 py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Your performance"
          title="Study Progress Dashboard"
          description="Dashboard tập trung vào số liệu học tập quan trọng: số bài đã làm, điểm trung bình, từ vựng đã lưu, streak và gợi ý bài học tiếp theo."
          action={
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 font-bold text-ink shadow-soft">
              <span className="h-3 w-3 rounded-full bg-growth-dark" /> Live Study Session
            </span>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {progressStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-growth text-academic-blue">
                  <stat.icon size={25} />
                </span>
                <span className="font-bold text-growth-dark">{stat.delta}</span>
              </div>
              <p className="mt-8 text-sm font-bold text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-black text-ink">{stat.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="soft-panel p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-ink">Weekly Progress</h3>
                <p className="mt-1 text-muted">Score consistency over the last 7 days</p>
              </div>
              <div className="flex rounded-2xl bg-zinc-100 p-1">
                <button className="rounded-xl bg-white px-4 py-2 font-bold text-ink shadow-soft">
                  Listening
                </button>
                <button className="rounded-xl px-4 py-2 font-bold text-muted">Reading</button>
              </div>
            </div>

            <div className="mt-8 grid h-64 grid-cols-7 items-end gap-4 border-b border-zinc-200 pb-4">
              {[36, 58, 48, 64, 71, 56, 80].map((height, index) => (
                <div key={index} className="flex h-full flex-col items-center justify-end gap-3">
                  <div className="relative flex h-44 w-full items-end justify-center">
                    <span className="absolute bottom-0 h-full w-2 rounded-full bg-growth-dark/10" />
                    <span
                      className="relative w-5 rounded-full bg-growth-dark"
                      style={{ height }}
                    />
                  </div>
                  <span className="text-sm font-bold text-muted">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] bg-growth-dark p-7 text-white shadow-soft">
            <TrendingUp size={28} />
            <h3 className="mt-5 text-2xl font-black">Focus Required</h3>
            <p className="mt-3 leading-7 text-white/82">
              Bạn đang yếu Part 5: Incomplete Sentences. Hôm nay nên ưu tiên
              luyện grammar và bẫy đáp án.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="flex justify-between font-bold">
                  <span>Tenses Mastery</span>
                  <span className="text-growth">45%</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="flex justify-between font-bold">
                  <span>Phonetics</span>
                  <span className="text-growth">62%</span>
                </div>
              </div>
            </div>
            <Button className="mt-6 w-full">Improve Now</Button>
          </aside>
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-ink">Gợi ý bài học tiếp theo</h3>
            <p className="mt-2 text-muted">Personalized learning path based on your score</p>
          </div>
          <a
            href="#practice"
            className="inline-flex items-center gap-2 font-bold text-growth-dark"
          >
            View all lessons <ArrowRight size={18} />
          </a>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {nextLessons.map((lesson) => (
            <article
              key={lesson.title}
              className="overflow-hidden rounded-[28px] border border-white/80 bg-white/82 shadow-soft"
            >
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url('${lesson.image}')` }}
              />
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-growth px-3 py-1 text-xs font-black text-academic-blue">
                    {lesson.category}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-muted">
                    {lesson.duration}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-black text-ink">{lesson.title}</h3>
                <p className="mt-2 leading-7 text-muted">{lesson.copy}</p>
                <button className="mt-5 inline-flex items-center gap-2 font-bold text-growth-dark">
                  Start lesson <PlayCircle size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
