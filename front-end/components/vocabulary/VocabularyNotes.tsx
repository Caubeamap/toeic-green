"use client";

import { useMemo, useState } from "react";
import { Heart, Plus, Search, Volume2 } from "lucide-react";
import { vocabWords } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/common/SectionHeading";

const tags = ["All", "Business", "Travel", "Office", "Contract", "Meeting", "Email"];
const statuses = ["All", "New", "Learning", "Mastered"];

export function VocabularyNotes() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredWords = useMemo(() => {
    return vocabWords.filter((item) => {
      const matchesQuery =
        item.word.toLowerCase().includes(query.toLowerCase()) ||
        item.meaning.toLowerCase().includes(query.toLowerCase());
      const matchesTag = tag === "All" || item.tags.includes(tag);
      const matchesStatus = status === "All" || item.status === status;
      return matchesQuery && matchesTag && matchesStatus;
    });
  }, [query, tag, status]);

  return (
    <section id="vocabulary" className="bg-white py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Vocabulary notes"
          title="Ghi chú từ vựng hằng ngày theo đúng ngữ cảnh TOEIC"
          description="Thiết kế dạng thẻ giúp đọc nhanh nghĩa, phiên âm, ví dụ, tag chủ đề và trạng thái học của từng từ."
          action={
            <Button variant="dark">
              <Plus size={18} /> Add New Word
            </Button>
          }
        />

        <div className="soft-panel mb-8 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-14 w-full rounded-2xl border border-zinc-200 bg-white/80 pl-12 pr-4 font-semibold outline-none transition focus:border-growth-dark focus:ring-4 focus:ring-growth/20"
                placeholder="Search words, meanings..."
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-bold transition",
                    status === item
                      ? "border-growth bg-growth text-academic-blue"
                      : "border-zinc-200 bg-white/70 text-muted"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((item) => (
              <button
                key={item}
                onClick={() => setTag(item)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition",
                  tag === item
                    ? "border-academic-blue bg-academic-blue text-white"
                    : "border-zinc-200 bg-white/70 text-muted"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredWords.map((word) => (
            <article key={word.word} className="soft-panel p-6">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-black",
                    word.status === "Mastered"
                      ? "bg-zinc-700 text-white"
                      : word.status === "Learning"
                        ? "bg-growth text-academic-blue"
                        : "bg-mist-blue text-academic-blue"
                  )}
                >
                  {word.status}
                </span>
                <div className="flex gap-3 text-growth-dark">
                  <Volume2 size={20} />
                  <Heart size={20} />
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-black text-growth-dark">{word.word}</h3>
              <p className="mt-1 text-sm font-semibold text-muted">
                {word.phonetic} · {word.type}
              </p>
              <div className="mt-5 space-y-4">
                <InfoBlock label="Meaning (VN)" value={word.meaning} />
                <InfoBlock label="Example" value={`"${word.example}"`} italic />
                <InfoBlock label="Personal note" value={word.note} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {word.tags.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}

          <button className="grid min-h-[360px] place-items-center rounded-[28px] border border-dashed border-growth-dark/32 bg-growth/8 p-8 text-center transition hover:bg-growth/14">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-growth-dark shadow-soft">
                +
              </span>
              <h3 className="mt-5 text-2xl font-black text-ink">Add Word</h3>
              <p className="mt-3 text-muted">Found a new word in a test? Save it here.</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({
  label,
  value,
  italic
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={cn("mt-1 leading-7 text-ink", italic && "italic")}>{value}</p>
    </div>
  );
}
