import { useState } from "react";
import { AlertCircle, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import type { PartOfSpeech } from "../types";
import { lookupWord } from "../services/dictionary";
import type { VocabularyInput } from "../services/api";

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: VocabularyInput) => Promise<void>;
};

type FormData = {
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  example: string;
  exampleTranslation: string;
  tags: string[];
  note: string;
  audioUrl: string;
};

const INITIAL_FORM: FormData = {
  word: "",
  phonetic: "",
  partOfSpeech: "noun",
  meaning: "",
  example: "",
  exampleTranslation: "",
  tags: [],
  note: "",
  audioUrl: "",
};

const POS_OPTIONS: { value: PartOfSpeech; label: string }[] = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "phrase", label: "Phrase" },
];

export function AddVocabularyModal({ open, onClose, onAdd }: AddModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLooking, setIsLooking] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "success" | "not-found">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!open) return null;

  // ── Dictionary lookup ────────────────────────────────────────────

  async function handleLookup() {
    const word = form.word.trim();
    if (!word) {
      setErrors((prev) => ({ ...prev, word: "Enter a word first" }));
      return;
    }

    setIsLooking(true);
    setLookupStatus("idle");

    const result = await lookupWord(word);

    if (result) {
      setForm((prev) => ({
        ...prev,
        phonetic: result.phonetic || prev.phonetic,
        partOfSpeech: result.partOfSpeech,
        example: result.example || prev.example,
        audioUrl: result.audioUrl,
      }));
      setLookupStatus("success");
      // Clear errors on successfully looked-up fields
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.word;
        if (result.example) delete copy.example;
        return copy;
      });
    } else {
      setLookupStatus("not-found");
    }

    setIsLooking(false);
  }

  // ── Form helpers ─────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.word.trim()) newErrors.word = "Word is required";
    if (!form.meaning.trim()) newErrors.meaning = "Meaning is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const input: VocabularyInput = {
      word: form.word.trim(),
      phonetic: form.phonetic.trim() || `/${form.word.trim()}/`,
      partOfSpeech: form.partOfSpeech,
      meaning: form.meaning.trim(),
      example: form.example.trim(),
      exampleTranslation: form.exampleTranslation.trim(),
      note: form.note.trim() || undefined,
      audioUrl: form.audioUrl || undefined,
      status: "learning",
      isFavorite: false,
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onAdd(input);
      setForm(INITIAL_FORM);
      setErrors({});
      setLookupStatus("idle");
      onClose();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, "Không thể lưu từ. Vui lòng thử lại.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (submitError) setSubmitError(null);
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
    // Reset lookup status when word changes
    if (key === "word") setLookupStatus("idle");
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-growth-dark" />
              <h2 className="text-lg font-extrabold text-ink">Add New Word</h2>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Word input + Lookup button */}
            <FieldGroup label="Word *" error={errors.word}>
              <div className="flex gap-2">
                <input
                  value={form.word}
                  onChange={(e) => updateField("word", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  className={cn(fieldClass(!!errors.word), "flex-1")}
                  placeholder="e.g., negotiate"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={isLooking || !form.word.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-academic-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-academic-blue/90 disabled:opacity-50"
                >
                  {isLooking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                  Lookup
                </button>
              </div>
              {/* Lookup status feedback */}
              {lookupStatus === "success" && (
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  ✓ Found — phonetic, part of speech & example auto-filled.
                </p>
              )}
              {lookupStatus === "not-found" && (
                <p className="mt-1 text-xs font-semibold text-amber-600">
                  Word not found in dictionary. Please fill in manually.
                </p>
              )}
            </FieldGroup>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Phonetic">
                <input
                  value={form.phonetic}
                  onChange={(e) => updateField("phonetic", e.target.value)}
                  className={fieldClass(false)}
                  placeholder="/nɪˈɡoʊ.ʃi.eɪt/"
                />
              </FieldGroup>
              <FieldGroup label="Part of Speech">
                <select
                  value={form.partOfSpeech}
                  onChange={(e) =>
                    updateField("partOfSpeech", e.target.value as PartOfSpeech)
                  }
                  className={fieldClass(false)}
                >
                  {POS_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            <FieldGroup label="Meaning (Vietnamese) *" error={errors.meaning}>
              <input
                value={form.meaning}
                onChange={(e) => updateField("meaning", e.target.value)}
                className={fieldClass(!!errors.meaning)}
                placeholder="Thương lượng, đàm phán"
              />
            </FieldGroup>

            <FieldGroup label="Example Sentence">
              <textarea
                value={form.example}
                onChange={(e) => updateField("example", e.target.value)}
                className={cn(fieldClass(false), "min-h-[64px] resize-none")}
                placeholder="We need to negotiate a better contract."
                rows={2}
              />
            </FieldGroup>

            <FieldGroup label="Example Translation">
              <input
                value={form.exampleTranslation}
                onChange={(e) =>
                  updateField("exampleTranslation", e.target.value)
                }
                className={fieldClass(false)}
                placeholder="Chúng ta cần đàm phán một hợp đồng tốt hơn."
              />
            </FieldGroup>



            {/* Lỗi khi lưu (vd từ đã tồn tại trong sổ) */}
            {submitError && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                <AlertCircle size={14} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-growth-dark px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Add Word
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function fieldClass(hasError: boolean) {
  return cn(
    "h-10 w-full rounded-xl border bg-zinc-50/60 px-3 text-sm font-medium text-ink outline-none transition placeholder:text-zinc-400 focus:bg-white focus:ring-2",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-200 focus:border-growth-dark focus:ring-growth/20"
  );
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-zinc-500">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>
      )}
    </div>
  );
}
