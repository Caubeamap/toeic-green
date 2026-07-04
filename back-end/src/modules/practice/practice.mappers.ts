import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  TestWithParts,
  QuestionWithContext,
  ToeicQuestionSource,
  AttemptWithAnswers,
  AttemptBaseWithParts,
  AttemptSummarySource,
  SummaryRow,
  AttemptResultRow,
} from './practice.queries';

export function reconstructAttempt(
  rows: AttemptResultRow[],
  test: TestWithParts,
): AttemptWithAnswers | null {
  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  const attempt: AttemptWithAnswers = {
    id: firstRow.attempt_id,
    publicId: firstRow.attempt_public_id,
    userId: firstRow.attempt_user_id,
    testId: firstRow.attempt_test_id,
    mode: firstRow.attempt_mode,
    status: firstRow.attempt_status,
    correctCount: firstRow.attempt_correct_count,
    totalCount: firstRow.attempt_total_count,
    scaledScore: firstRow.attempt_scaled_score,
    durationSeconds: firstRow.attempt_duration_seconds,
    startedAt: firstRow.attempt_started_at,
    completedAt: firstRow.attempt_completed_at,
    test: test,
    answers: [],
  };

  for (const row of rows) {
    if (row.question_id === null) {
      continue;
    }

    const group =
      row.question_group_id !== null
        ? {
            id: row.question_group_id,
            testPartId: row.question_test_part_id,
            passage: row.group_passage,
            audioUrl: row.group_audio_url,
            imageUrl: row.group_image_url,
            transcript: row.group_transcript,
            sortOrder: row.group_sort_order ?? 0,
          }
        : null;

    const testPart = {
      id: row.question_test_part_id,
      testId: firstRow.attempt_test_id,
      partNumber: row.part_part_number,
      section: row.part_section,
      label: row.part_label,
      description: row.part_description,
      questionCount: row.part_question_count,
    };

    const question = {
      id: row.question_id,
      testPartId: row.question_test_part_id,
      groupId: row.question_group_id,
      questionNumber: row.question_question_number,
      stem: row.question_stem,
      optionA: row.question_option_a,
      optionB: row.question_option_b,
      optionC: row.question_option_c,
      optionD: row.question_option_d,
      correctAnswer: row.question_correct_answer,
      explanation: row.question_explanation,
      imageUrl: row.question_image_url,
      audioUrl: row.question_audio_url,
      createdAt: row.question_created_at,
      testPart: testPart,
      group: group,
    };

    const answer = {
      attemptId: row.attempt_id,
      questionId: row.question_id,
      selectedAnswer: row.answer_selected_answer,
      isCorrect: row.answer_is_correct,
      isFlagged: row.answer_is_flagged,
      timeSpentMs: row.answer_time_spent_ms,
      answeredAt: row.answer_answered_at,
      question:
        question as unknown as AttemptWithAnswers['answers'][number]['question'],
    } as unknown as AttemptWithAnswers['answers'][number];

    attempt.answers.push(answer);
  }

  return attempt;
}

export function findTestInSnapshot(tests: TestWithParts[], slug: string) {
  const test = tests.find((item) => item.slug === slug);

  if (!test) {
    throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y bÃ i luyá»‡n TOEIC.');
  }

  return test;
}

export function toPracticeTest(test: TestWithParts, attempts: number) {
  return {
    id: test.slug,
    title: toDisplayTitle(test),
    subtitle: test.subtitle ?? '',
    type: toDisplayType(test.type),
    shortType: test.shortType,
    minutes: test.durationMinutes,
    questions: test.totalQuestions,
    access: toDisplayAccess(test.accessLevel),
    status: 'New',
    attempts,
    parts: test.parts.map((part) => ({
      id: toPartId(part.partNumber),
      label: part.label,
      description: part.description,
      questions: part.questionCount,
    })),
  };
}

export function toPracticeTestWithAttempts(
  test: TestWithParts,
  attempts: number,
  recentAttempts: AttemptBaseWithParts[],
) {
  const summaries = recentAttempts.map((attempt) => toAttemptSummary(attempt));
  const latestAttempt = summaries[0];

  return {
    ...toPracticeTest(test, attempts),
    status: summaries.length > 0 ? 'Completed' : 'New',
    recentAttempts: summaries,
    completedAt: latestAttempt?.attemptedAt,
  };
}

export function toAttemptBaseWithParts(row: SummaryRow): AttemptBaseWithParts {
  return {
    id: row.id,
    publicId: row.publicId,
    testId: row.testId,
    mode: row.mode,
    correctCount: row.correctCount,
    totalCount: row.totalCount,
    scaledScore: row.scaledScore,
    durationSeconds: row.durationSeconds,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    test: {
      slug: row.testSlug,
      title: row.testTitle,
      subtitle: row.testSubtitle,
      totalQuestions: row.testTotalQuestions,
    },
    partNumbers: row.partNumbers ?? [],
  };
}

export function groupAttemptsByTestId(attempts: AttemptBaseWithParts[]) {
  const attemptsByTestId = new Map<number, AttemptBaseWithParts[]>();

  attempts.forEach((attempt) => {
    const current = attemptsByTestId.get(attempt.testId) ?? [];
    attemptsByTestId.set(attempt.testId, [...current, attempt]);
  });

  return attemptsByTestId;
}

export function toToeicQuestion(
  question: ToeicQuestionSource,
  options: { includeAnswer: boolean } = { includeAnswer: true },
) {
  const dto: {
    id: string;
    partId: string;
    questionNumber: number;
    passage?: string;
    passageGroupId?: string;
    stem: string;
    options: Array<{ label: string; text: string }>;
    image_url: string | null;
    audio_url: string | null;
    transcript: string | null;
    correctAnswer?: string;
    explanation?: string | null;
  } = {
    id: question.id.toString(),
    partId: toPartId(question.testPart.partNumber),
    questionNumber: question.questionNumber,
    passage: question.group?.passage ?? undefined,
    passageGroupId: question.groupId?.toString(),
    stem: question.stem,
    options: [
      { label: 'A', text: question.optionA },
      { label: 'B', text: question.optionB },
      { label: 'C', text: question.optionC },
      ...(hasOptionD(question)
        ? [{ label: 'D', text: question.optionD ?? '' }]
        : []),
    ],
    image_url: question.imageUrl ?? question.group?.imageUrl ?? null,
    audio_url: question.audioUrl ?? question.group?.audioUrl ?? null,
    transcript: question.group?.transcript ?? null,
  };

  if (options.includeAnswer && 'correctAnswer' in question) {
    dto.correctAnswer = question.correctAnswer;
    dto.explanation = question.explanation;
  }

  return dto;
}

export function toAttemptSummary(attempt: AttemptSummarySource) {
  const completedAt = attempt.completedAt ?? attempt.startedAt;
  const scopeLabels = getScopeLabels(attempt);
  // Tiêu đề hiển thị đã là "Practice Toeic Test N"; không nối thêm subtitle
  // chung ("TOEIC Green Practice") để tránh lặp dư thừa.
  const testTitle = toDisplayTitle(attempt.test);

  return {
    id: attempt.publicId,
    testId: attempt.test.slug,
    testTitle,
    attemptedAt: formatDate(completedAt),
    mode: attempt.mode === 'FULL_TEST' ? 'Full test' : 'Practice',
    scopeLabels,
    correct: attempt.correctCount,
    total: attempt.totalCount,
    durationSeconds: attempt.durationSeconds,
    detailHref: `/practice/${attempt.test.slug}/results/${attempt.publicId}`,
    // scaledScore is stored only when the attempt covered a full Listening +
    // Reading scope (calculateScaledScore returns null otherwise), so a
    // non-null value already implies a complete scope.
    scaledScore: attempt.scaledScore ?? undefined,
    timestamp: completedAt.toISOString(),
  };
}

export function toAttemptResult(
  attempt: AttemptWithAnswers,
  timeLimitMinutes?: number,
) {
  const summary = toAttemptSummary(attempt);
  const answers = Object.fromEntries(
    attempt.answers
      .filter((answer) => answer.selectedAnswer)
      .map((answer) => [answer.questionId.toString(), answer.selectedAnswer]),
  );
  const flaggedIds = attempt.answers
    .filter((answer) => answer.isFlagged)
    .map((answer) => answer.questionId.toString());
  const questions = attempt.answers.map((answer) =>
    toToeicQuestion(answer.question),
  );

  return {
    test: toPracticeTest(attempt.test, 0),
    attempt: summary,
    questions,
    result: {
      testId: attempt.test.slug,
      testTitle: summary.testTitle,
      correct: attempt.correctCount,
      total: attempt.totalCount,
      answered: Object.keys(answers).length,
      flagged: flaggedIds.length,
      flaggedIds,
      duration: attempt.durationSeconds,
      answers,
      timestamp: summary.timestamp,
      parts: getPartIds(attempt),
      timeLimit: timeLimitMinutes,
    },
  };
}

export function parseQuestionIds(questionIds: string[]) {
  try {
    const uniqueIds = Array.from(new Set(questionIds));
    return uniqueIds.map((id) => BigInt(id));
  } catch {
    throw new BadRequestException('Danh sách câu hỏi không hợp lệ.');
  }
}

export function getSelectedAnswer(
  answers: Record<string, string>,
  question: QuestionWithContext,
) {
  const selectedAnswer = answers[question.id.toString()];
  if (selectedAnswer === undefined || selectedAnswer === '') {
    return null;
  }

  const allowedAnswers = [
    'A',
    'B',
    'C',
    ...(hasOptionD(question) ? ['D'] : []),
  ];
  if (!allowedAnswers.includes(selectedAnswer)) {
    throw new BadRequestException('Đáp án gửi lên không hợp lệ.');
  }

  return selectedAnswer;
}

export function calculateScaledScore(
  questions: QuestionWithContext[],
  answers: Record<string, string>,
) {
  const listening = questions.filter((question) =>
    [1, 2, 3, 4].includes(question.testPart.partNumber),
  );
  const reading = questions.filter((question) =>
    [5, 6, 7].includes(question.testPart.partNumber),
  );

  if (!hasCompleteToeicScoreScope(questions)) {
    return null;
  }

  const listeningCorrect = listening.filter(
    (question) => answers[question.id.toString()] === question.correctAnswer,
  ).length;
  const readingCorrect = reading.filter(
    (question) => answers[question.id.toString()] === question.correctAnswer,
  ).length;

  return (
    estimateSectionScore(listeningCorrect) +
    estimateSectionScore(readingCorrect)
  );
}

function estimateSectionScore(correct: number) {
  const rawScoreAnchors = [
    { raw: 0, scaled: 5 },
    { raw: 10, scaled: 35 },
    { raw: 20, scaled: 80 },
    { raw: 30, scaled: 130 },
    { raw: 40, scaled: 185 },
    { raw: 50, scaled: 250 },
    { raw: 60, scaled: 310 },
    { raw: 70, scaled: 365 },
    { raw: 80, scaled: 420 },
    { raw: 90, scaled: 465 },
    { raw: 100, scaled: 495 },
  ];
  const boundedCorrect = Math.max(0, Math.min(100, correct));
  const nextAnchorIndex = rawScoreAnchors.findIndex(
    (anchor) => boundedCorrect <= anchor.raw,
  );

  if (nextAnchorIndex <= 0) {
    return rawScoreAnchors[0].scaled;
  }

  const previous = rawScoreAnchors[nextAnchorIndex - 1];
  const next = rawScoreAnchors[nextAnchorIndex];
  const progress = (boundedCorrect - previous.raw) / (next.raw - previous.raw);
  const scaled = previous.scaled + (next.scaled - previous.scaled) * progress;

  return Math.max(5, Math.min(495, Math.round(scaled / 5) * 5));
}

function hasCompleteToeicScoreScope(
  questions: Array<{ testPart: { partNumber: number } }>,
) {
  const listeningCount = questions.filter((question) =>
    [1, 2, 3, 4].includes(question.testPart.partNumber),
  ).length;
  const readingCount = questions.filter((question) =>
    [5, 6, 7].includes(question.testPart.partNumber),
  ).length;

  return listeningCount === 100 && readingCount === 100;
}

function getScopeLabels(attempt: AttemptSummarySource) {
  if (attempt.totalCount >= attempt.test.totalQuestions) {
    return [];
  }

  return getPartIds(attempt).map((partId) => partId.replace('part-', 'Part '));
}

function getAttemptPartNumbers(attempt: AttemptSummarySource): number[] {
  if ('partNumbers' in attempt) {
    return attempt.partNumbers;
  }

  return attempt.answers.map((answer) => answer.question.testPart.partNumber);
}

function getPartIds(attempt: AttemptSummarySource) {
  const partIds = new Set(
    getAttemptPartNumbers(attempt).map((partNumber) => toPartId(partNumber)),
  );

  return Array.from(partIds).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

function toDisplayType(type: string) {
  return type === 'SPEAKING_WRITING'
    ? 'Speaking & Writing'
    : 'Listening & Reading';
}

function toDisplayAccess(accessLevel: string) {
  return accessLevel === 'PRO' ? 'Pro' : 'Free';
}

function hasOptionD(question: {
  optionD: string | null;
  testPart: { partNumber: number };
}) {
  return question.testPart.partNumber === 1 || Boolean(question.optionD);
}

function getBatchKey(test: Pick<TestWithParts, 'slug'>) {
  return test.slug.replace(/-\d+$/, '');
}

export function sortTestsByDisplayNumber(tests: TestWithParts[]) {
  const batchMinId = new Map<string, number>();

  for (const test of tests) {
    const batchKey = getBatchKey(test);
    const currentMin = batchMinId.get(batchKey) ?? Infinity;
    if (test.id < currentMin) {
      batchMinId.set(batchKey, test.id);
    }
  }

  return [...tests].sort((a, b) => {
    const aBatch = getBatchKey(a);
    const bBatch = getBatchKey(b);

    if (aBatch !== bBatch) {
      const aMinId = batchMinId.get(aBatch) ?? 0;
      const bMinId = batchMinId.get(bBatch) ?? 0;
      return aMinId - bMinId;
    }

    const aNumber = getDisplayNumber(a);
    const bNumber = getDisplayNumber(b);

    if (aNumber !== bNumber) {
      return aNumber - bNumber;
    }

    return a.slug.localeCompare(b.slug, undefined, { numeric: true });
  });
}

function toDisplayTitle(test: Pick<TestWithParts, 'slug' | 'title'>) {
  return test.title;
}

function getDisplayNumber(test: Pick<TestWithParts, 'slug' | 'title'>) {
  const slugMatch = test.slug.match(/(\d+)$/);
  const titleMatch = test.title.match(/(\d+)(?!.*\d)/);
  const value = Number(slugMatch?.[1] ?? titleMatch?.[1] ?? 0);

  return Number.isFinite(value) && value > 0 ? value : 1;
}

function toPartId(partNumber: number) {
  return `part-${partNumber}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
