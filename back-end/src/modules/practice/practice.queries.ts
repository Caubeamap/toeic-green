import { Prisma } from '@prisma/client';

export const TEST_INCLUDE = {
  parts: {
    orderBy: { partNumber: 'asc' },
  },
} satisfies Prisma.TestInclude;

export const QUESTIONS_INCLUDE = {
  testPart: true,
  group: true,
} satisfies Prisma.QuestionInclude;

export const EXAM_QUESTION_SELECT = {
  id: true,
  groupId: true,
  questionNumber: true,
  stem: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  imageUrl: true,
  audioUrl: true,
  testPart: {
    select: {
      partNumber: true,
    },
  },
  group: {
    select: {
      id: true,
      passage: true,
      imageUrl: true,
      audioUrl: true,
      transcript: true,
    },
  },
} satisfies Prisma.QuestionSelect;

export const TEST_DETAIL_ATTEMPT_LIMIT = 5;
export const PRACTICE_TEST_CACHE_TTL_MS = 60_000;

export type TestWithParts = Prisma.TestGetPayload<{
  include: typeof TEST_INCLUDE;
}>;
export type QuestionWithContext = Prisma.QuestionGetPayload<{
  include: typeof QUESTIONS_INCLUDE;
}>;
type ExamQuestionWithContext = Prisma.QuestionGetPayload<{
  select: typeof EXAM_QUESTION_SELECT;
}>;
export type ToeicQuestionSource = QuestionWithContext | ExamQuestionWithContext;
export type AttemptWithAnswers = Prisma.PracticeAttemptGetPayload<{
  include: {
    answers: { include: { question: { include: typeof QUESTIONS_INCLUDE } } };
  };
}> & { test: TestWithParts };
export type AttemptBaseWithParts = {
  id: bigint;
  publicId: string;
  testId: number;
  mode: string;
  correctCount: number;
  totalCount: number;
  scaledScore: number | null;
  durationSeconds: number;
  startedAt: Date;
  completedAt: Date | null;
  test: {
    slug: string;
    title: string;
    subtitle: string | null;
    totalQuestions: number;
  };
  partNumbers: number[];
};
export type AttemptSummarySource = AttemptWithAnswers | AttemptBaseWithParts;
export interface SummaryRow {
  id: bigint;
  publicId: string;
  testId: number;
  mode: string;
  correctCount: number;
  totalCount: number;
  scaledScore: number | null;
  durationSeconds: number;
  startedAt: Date;
  completedAt: Date | null;
  testSlug: string;
  testTitle: string;
  testSubtitle: string | null;
  testTotalQuestions: number;
  partNumbers: number[];
}
export type PracticeTestsSnapshot = {
  countsByTestId: Map<number, number>;
  tests: TestWithParts[];
};

export interface UserStatsRow {
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  bestAccuracy: number;
  bestScaledScore: number | null;
}

export interface AttemptResultRow {
  attempt_id: bigint;
  attempt_public_id: string;
  attempt_user_id: string;
  attempt_test_id: number;
  attempt_mode: string;
  attempt_status: string;
  attempt_correct_count: number;
  attempt_total_count: number;
  attempt_scaled_score: number | null;
  attempt_duration_seconds: number;
  attempt_started_at: Date;
  attempt_completed_at: Date | null;

  answer_selected_answer: string | null;
  answer_is_correct: boolean;
  answer_is_flagged: boolean;
  answer_time_spent_ms: number;
  answer_answered_at: Date;

  question_id: bigint | null;
  question_test_part_id: number;
  question_group_id: bigint | null;
  question_question_number: number;
  question_stem: string;
  question_option_a: string;
  question_option_b: string;
  question_option_c: string;
  question_option_d: string | null;
  question_correct_answer: string;
  question_explanation: string | null;
  question_image_url: string | null;
  question_audio_url: string | null;
  question_created_at: Date;

  part_id: number;
  part_part_number: number;
  part_section: string;
  part_label: string;
  part_description: string;
  part_question_count: number;

  group_id: bigint | null;
  group_passage: string | null;
  group_audio_url: string | null;
  group_image_url: string | null;
  group_transcript: string | null;
  group_sort_order: number | null;
}
