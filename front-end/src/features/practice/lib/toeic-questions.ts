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
