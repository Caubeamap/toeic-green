import { useState, useEffect } from "react";
import {
  Heart,
  Volume2,
  X,
  Clock,
  Edit2,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import type { PartOfSpeech, VocabularyWord } from "../types";
import { STATUS_CONFIG, POS_LABELS } from "../types";
import { playAudio } from "../services/storage";
import type { VocabularyInput } from "../services/api";

type DrawerProps = {
  word: VocabularyWord | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onUpdate: (id: string, patch: Partial<VocabularyInput>) => Promise<void>;
  onDelete: (id: string) => void;
};

const POS_OPTIONS: { value: PartOfSpeech; label: string }[] = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "phrase", label: "Phrase" },
];

export function VocabularyDetailDrawer({
  word,
  onClose,
  onToggleFavorite,
  onToggleMastered,
  onUpdate,
  onDelete,
}: DrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<VocabularyWord | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof VocabularyWord, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset edit form when word changes or drawer opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (word) {
        setForm({ ...word });
        setIsEditing(false);
        setErrors({});
        setSaveError(null);
        setConfirmDelete(false);
      } else {
        setForm(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [word]);

  if (!word || !form) return null;

  const statusCfg = STATUS_CONFIG[word.status];

  // ── Handlers ───────────────────────────────────────────────────

  function handleFieldChange<K extends keyof VocabularyWord>(
    key: K,
    value: VocabularyWord[K]
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  }


  function validate(): boolean {
    const newErrors: Partial<Record<keyof VocabularyWord, string>> = {};
    if (!form?.word.trim()) newErrors.word = "Word is required";
    if (!form?.meaning.trim()) newErrors.meaning = "Meaning is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate() || !form || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdate(form.id, {
        word: form.word.trim(),
        phonetic: form.phonetic.trim() || `/${form.word.trim()}/`,
        partOfSpeech: form.partOfSpeech,
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        exampleTranslation: form.exampleTranslation.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "Không thể lưu thay đổi. Vui lòng thử lại.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (word) {
      setForm({ ...word });
    }
    setIsEditing(false);
    setErrors({});
    setSaveError(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-md overflow-y-auto bg-white shadow-xl sm:rounded-l-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">
            {isEditing ? "Edit Word" : "Word Detail"}
          </h2>
          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-ink"
                title="Edit Word"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Edit Form Mode */}
        {isEditing ? (
          <div className="p-5 space-y-4 pb-24">
            <FieldGroup label="Word *" error={errors.word}>
              <input
                value={form.word}
                onChange={(e) => handleFieldChange("word", e.target.value)}
                className={fieldClass(!!errors.word)}
                placeholder="e.g., substantial"
              />
            </FieldGroup>

            <div className="grid gap-4 grid-cols-2">
              <FieldGroup label="Phonetic">
                <input
                  value={form.phonetic}
                  onChange={(e) => handleFieldChange("phonetic", e.target.value)}
                  className={fieldClass(false)}
                  placeholder="/səbˈstæn.ʃəl/"
                />
              </FieldGroup>
              <FieldGroup label="Part of Speech">
                <select
                  value={form.partOfSpeech}
                  onChange={(e) =>
                    handleFieldChange("partOfSpeech", e.target.value as PartOfSpeech)
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
                onChange={(e) => handleFieldChange("meaning", e.target.value)}
                className={fieldClass(!!errors.meaning)}
                placeholder="Nhiều, đáng kể"
              />
            </FieldGroup>

            <FieldGroup label="Example Sentence">
              <textarea
                value={form.example}
                onChange={(e) => handleFieldChange("example", e.target.value)}
                className={cn(fieldClass(false), "min-h-[64px] resize-none")}
                placeholder="The project required a substantial amount of time."
                rows={2}
              />
            </FieldGroup>

            <FieldGroup label="Example Translation">
              <input
                value={form.exampleTranslation}
                onChange={(e) =>
                  handleFieldChange("exampleTranslation", e.target.value)
                }
                className={fieldClass(false)}
                placeholder="Dự án yêu cầu một lượng thời gian đáng kể."
              />
            </FieldGroup>

            {saveError && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                <AlertCircle size={14} />
                <span>{saveError}</span>
              </div>
            )}

            {/* Actions for editing */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 bg-white p-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-growth-dark py-3 text-sm font-bold text-white transition hover:bg-[#005d16] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* Static Detail View Mode */
          <div className="p-5 space-y-6">
            {/* Word heading */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-3xl font-extrabold text-ink">
                    {word.word}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {word.phonetic}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    <span className="font-semibold text-academic-blue">
                      {POS_LABELS[word.partOfSpeech]}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleFavorite(word.id)}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl transition",
                      word.isFavorite
                        ? "bg-rose-50 text-rose-500"
                        : "bg-zinc-50 text-zinc-400 hover:text-rose-400"
                    )}
                  >
                    <Heart
                      size={18}
                      fill={word.isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => playAudio(word.audioUrl)}
                    disabled={!word.audioUrl}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl transition",
                      word.audioUrl
                        ? "bg-zinc-50 text-zinc-400 hover:text-growth-dark"
                        : "bg-zinc-50 text-zinc-200 cursor-default"
                    )}
                    title={word.audioUrl ? "Listen to pronunciation" : "No audio available"}
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold",
                    statusCfg.bg,
                    statusCfg.color,
                    statusCfg.border
                  )}
                >
                  {statusCfg.label}
                </span>
                <button
                  onClick={() => onToggleMastered(word.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-bold transition",
                    word.status === "mastered"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-growth hover:bg-growth/10 hover:text-growth-dark"
                  )}
                >
                  {word.status === "mastered"
                    ? "✓ Already Mastered"
                    : "Mark as Mastered"}
                </button>
              </div>
            </div>

            {/* Meaning section */}
            <section>
              <SectionLabel>Meaning (Vietnamese)</SectionLabel>
              <p className="mt-1.5 text-base font-semibold leading-relaxed text-ink">
                {word.meaning}
              </p>
            </section>

            {/* Example */}
            {word.example?.trim() && (
              <section>
                <SectionLabel>Example Sentence</SectionLabel>
                <div className="mt-1.5 rounded-xl bg-zinc-50 px-4 py-3">
                  <p className="text-sm italic leading-relaxed text-zinc-700">
                    &ldquo;{word.example}&rdquo;
                  </p>
                  {word.exampleTranslation?.trim() && (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {word.exampleTranslation}
                    </p>
                  )}
                </div>
              </section>
            )}



            {/* Meta info */}
            <section className="rounded-xl bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock size={12} />
                <span>
                  Added{" "}
                  {new Date(word.addedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {word.lastReviewedAt && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span>
                      Last reviewed{" "}
                      {new Date(word.lastReviewedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </>
                )}
              </div>
            </section>

            {/* Xóa từ khỏi sổ */}
            <section className="border-t border-zinc-100 pt-4">
              {confirmDelete ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <span className="text-xs font-bold text-red-600">
                    Xóa từ này khỏi sổ?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-500 transition hover:bg-white"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => onDelete(word.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 transition hover:text-red-600"
                >
                  <Trash2 size={14} />
                  Xóa từ này
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
      {children}
    </p>
  );
}

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
        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
