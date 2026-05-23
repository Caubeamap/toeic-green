import { CheckCircle2, Clock3, FileQuestion, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type TestCardProps = {
  test: {
    name: string;
    type: string;
    minutes: number;
    questions: number;
    difficulty: string;
    progress: number;
    status: string;
    score?: string;
    image: string;
  };
};

export function TestCard({ test }: TestCardProps) {
  const completed = test.status === "Completed";
  const inProgress = test.progress > 0 && !completed;

  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/80 bg-white/82 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glass">
      <div
        className="relative h-52 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(16,35,95,0.05), rgba(0,122,34,0.26)), url('${test.image}')`
        }}
      >
        <div className="absolute left-4 top-4 rounded-full bg-academic-blue px-3 py-1.5 text-xs font-extrabold text-white">
          {test.type}
        </div>
        <div
          className={cn(
            "absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold",
            test.difficulty === "Hard"
              ? "bg-zinc-900/70 text-white"
              : test.difficulty === "Easy"
                ? "bg-growth text-academic-blue"
                : "bg-white/80 text-ink"
          )}
        >
          {test.difficulty}
        </div>
        {completed ? (
          <div className="absolute inset-0 grid place-items-center bg-growth-dark/42">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-growth-dark shadow-soft">
              <CheckCircle2 size={22} /> Completed
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-black text-ink">{test.name}</h3>
          {test.status === "New Test" ? (
            <span className="rounded-full bg-growth px-3 py-1 text-xs font-black text-academic-blue">
              NEW
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold text-ink">
          <span className="inline-flex items-center gap-2">
            <Clock3 size={18} /> {test.minutes} Minutes
          </span>
          <span className="inline-flex items-center gap-2">
            <FileQuestion size={18} /> {test.questions} Questions
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm font-bold">
            <span>{completed ? "Score" : "Completion"}</span>
            <span className="text-growth-dark">
              {completed ? test.score : `${test.progress}%`}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-growth-dark transition-all"
              style={{ width: `${test.progress}%` }}
            />
          </div>
        </div>

        <Button
          variant={completed ? "secondary" : "dark"}
          className="mt-6 w-full"
        >
          {completed ? (
            <>
              Review Results <CheckCircle2 size={18} />
            </>
          ) : inProgress ? (
            <>
              Resume Test <RotateCcw size={18} />
            </>
          ) : (
            <>
              Start Test <Play size={18} />
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
