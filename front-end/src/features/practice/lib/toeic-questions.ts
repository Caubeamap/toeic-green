export type ToeicQuestion = {
  id: string;
  partId: string;
  questionNumber: number;
  passage?: string;
  passageGroupId?: string;
  stem: string;
  options: { label: string; text: string }[];
  correctAnswer?: string;
  image_url?: string | null;
  audio_url?: string | null;
  explanation?: string | null;
  transcript?: string | null;
};

export function isQuestionNumberOnlyStem(
  question: Pick<ToeicQuestion, "questionNumber" | "stem">
) {
  const stem = question.stem.replace(/\s+/g, " ").trim();
  if (!stem) return true;

  return new RegExp(
    `^question\\s+(?:no\\.\\s*)?${question.questionNumber}\\.?$`,
    "i"
  ).test(stem);
}

export function formatQuestionStem(stem: string): string {
  if (!stem) return "";
  // Replace 2 or more consecutive hyphens/dashes with underscores
  return stem.replace(/-{2,}/g, "_____");
}

