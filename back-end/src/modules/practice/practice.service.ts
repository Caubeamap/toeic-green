import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';

const TEST_INCLUDE = {
  parts: {
    orderBy: { partNumber: 'asc' },
  },
} satisfies Prisma.TestInclude;

const QUESTIONS_INCLUDE = {
  testPart: true,
  group: true,
} satisfies Prisma.QuestionInclude;

const EXAM_QUESTION_SELECT = {
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

const ATTEMPT_INCLUDE_LEAN = {
  answers: {
    include: {
      question: {
        include: QUESTIONS_INCLUDE,
      },
    },
    orderBy: {
      question: {
        questionNumber: 'asc',
      },
    },
  },
} satisfies Prisma.PracticeAttemptInclude;

const ATTEMPT_SUMMARY_INCLUDE = {
  test: {
    select: {
      slug: true,
      title: true,
      subtitle: true,
      totalQuestions: true,
    },
  },
  answers: {
    select: {
      question: {
        select: {
          testPart: {
            select: {
              partNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      question: {
        questionNumber: 'asc',
      },
    },
  },
} satisfies Prisma.PracticeAttemptInclude;

const USER_PROGRESS_ATTEMPT_LIMIT = 50;
const TEST_DETAIL_ATTEMPT_LIMIT = 5;
const PRACTICE_TEST_CACHE_TTL_MS = 60_000;

type TestWithParts = Prisma.TestGetPayload<{ include: typeof TEST_INCLUDE }>;
type QuestionWithContext = Prisma.QuestionGetPayload<{
  include: typeof QUESTIONS_INCLUDE;
}>;
type ExamQuestionWithContext = Prisma.QuestionGetPayload<{
  select: typeof EXAM_QUESTION_SELECT;
}>;
type ToeicQuestionSource = QuestionWithContext | ExamQuestionWithContext;
type AttemptWithAnswers = Prisma.PracticeAttemptGetPayload<{
  include: typeof ATTEMPT_INCLUDE_LEAN;
}> & { test: TestWithParts };
type AttemptSummaryWithParts = Prisma.PracticeAttemptGetPayload<{
  include: typeof ATTEMPT_SUMMARY_INCLUDE;
}>;
type AttemptSummarySource = AttemptWithAnswers | AttemptSummaryWithParts;
type PracticeTestsSnapshot = {
  countsByTestId: Map<number, number>;
  tests: TestWithParts[];
};

interface AttemptResultRow {
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

@Injectable()
export class PracticeService implements OnModuleInit {
  private testsSnapshotCache: {
    expiresAt: number;
    value: PracticeTestsSnapshot;
  } | null = null;
  private testsSnapshotPromise: Promise<PracticeTestsSnapshot> | null = null;

  private attemptResultCache = new Map<
    string,
    { expiresAt: number; value: Record<string, any> }
  >();
  private attemptResultPromises = new Map<
    string,
    Promise<Record<string, any>>
  >();

  private questionsCache = new Map<
    string,
    { expiresAt: number; value: Record<string, any>[] }
  >();
  private questionsPromises = new Map<string, Promise<Record<string, any>[]>>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Pre-warm cache and connection pool on startup asynchronously
    this.getTestsSnapshot().catch(() => {});
  }

  async listTests() {
    const { countsByTestId, tests } = await this.getTestsSnapshot();

    return this.sortTestsByDisplayNumber(tests).map((test) =>
      this.toPracticeTest(test, countsByTestId.get(test.id) ?? 0),
    );
  }

  async listTestsForUser(userId: string) {
    const [snapshot, recentAttempts] = await Promise.all([
      this.getTestsSnapshot(),
      this.findRecentAttemptSummaries(userId, {}, USER_PROGRESS_ATTEMPT_LIMIT),
    ]);
    const attemptsByTestId = this.groupAttemptsByTestId(recentAttempts);

    return this.sortTestsByDisplayNumber(snapshot.tests).map((test) =>
      this.toPracticeTestWithAttempts(
        test,
        snapshot.countsByTestId.get(test.id) ?? 0,
        attemptsByTestId.get(test.id) ?? [],
      ),
    );
  }

  async getTestBySlug(slug: string) {
    const { countsByTestId, tests } = await this.getTestsSnapshot();
    const test = this.findTestInSnapshot(tests, slug);

    return this.toPracticeTest(test, countsByTestId.get(test.id) ?? 0);
  }

  async getTestBySlugForUser(userId: string, slug: string) {
    const [snapshot, recentAttempts] = await Promise.all([
      this.getTestsSnapshot(),
      this.findRecentAttemptSummaries(
        userId,
        {
          test: {
            slug,
            isPublished: true,
          },
        },
        TEST_DETAIL_ATTEMPT_LIMIT,
      ),
    ]);
    const test = this.findTestInSnapshot(snapshot.tests, slug);

    return this.toPracticeTestWithAttempts(
      test,
      snapshot.countsByTestId.get(test.id) ?? 0,
      recentAttempts,
    );
  }

  async listQuestions(slug: string): Promise<Record<string, any>[]> {
    const cacheKey = slug;
    const now = Date.now();

    const cached = this.questionsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const existingPromise = this.questionsPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      await this.findPublishedTest(slug);

      const questions = await this.prisma.question.findMany({
        where: {
          testPart: {
            test: {
              slug,
              isPublished: true,
            },
          },
        },
        select: EXAM_QUESTION_SELECT,
        orderBy: [{ questionNumber: 'asc' }, { id: 'asc' }],
      });

      const result = questions.map((question) =>
        this.toToeicQuestion(question, { includeAnswer: false }),
      );

      this.questionsCache.set(cacheKey, {
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
        value: result,
      });

      return result;
    })();

    this.questionsPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.questionsPromises.delete(cacheKey);
    }
  }

  async listRecentAttempts(userId: string) {
    const attempts = await this.findRecentAttemptSummaries(userId, {}, 20);

    return attempts.map((attempt) => this.toAttemptSummary(attempt));
  }

  async submitAttempt(
    userId: string,
    slug: string,
    submitAttemptDto: SubmitPracticeAttemptDto,
  ) {
    const test = await this.findPublishedTest(slug);
    const questionIds = this.parseQuestionIds(submitAttemptDto.questionIds);
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds },
        testPart: {
          testId: test.id,
        },
      },
      include: QUESTIONS_INCLUDE,
      orderBy: [{ questionNumber: 'asc' }, { id: 'asc' }],
    });

    if (questions.length !== questionIds.length) {
      throw new BadRequestException('Danh sách câu hỏi không hợp lệ.');
    }

    const answers = submitAttemptDto.answers ?? {};
    const flaggedQuestionIds = new Set(
      submitAttemptDto.flaggedQuestionIds ?? [],
    );
    const correctCount = questions.reduce((total, question) => {
      const selected = this.getSelectedAnswer(answers, question);
      return selected === question.correctAnswer ? total + 1 : total;
    }, 0);

    const scaledScore = this.calculateScaledScore(questions, answers);

    const attempt = await this.prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.practiceAttempt.create({
        data: {
          userId,
          testId: test.id,
          mode: submitAttemptDto.mode,
          status: 'COMPLETED',
          correctCount,
          totalCount: questions.length,
          scaledScore,
          durationSeconds: submitAttemptDto.durationSeconds,
          completedAt: new Date(),
        },
      });

      await tx.attemptAnswer.createMany({
        data: questions.map((question) => {
          const selectedAnswer = this.getSelectedAnswer(answers, question);

          return {
            attemptId: createdAttempt.id,
            questionId: question.id,
            selectedAnswer,
            isCorrect: selectedAnswer === question.correctAnswer,
            isFlagged: flaggedQuestionIds.has(question.id.toString()),
          };
        }),
      });

      const attemptVal = await tx.practiceAttempt.findUniqueOrThrow({
        where: { id: createdAttempt.id },
        include: ATTEMPT_INCLUDE_LEAN,
      });
      (attemptVal as Record<string, any>).test = test;
      return attemptVal;
    });

    const result = this.toAttemptResult(
      attempt as AttemptWithAnswers,
      submitAttemptDto.timeLimitMinutes,
    );

    this.testsSnapshotCache = null;

    // Pre-populate attempt cache
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL
    this.attemptResultCache.set(`${userId}:${slug}:${attempt.publicId}`, {
      expiresAt,
      value: result,
    });
    this.attemptResultCache.set(`${userId}:${slug}:latest`, {
      expiresAt,
      value: result,
    });

    return result;
  }

  async getLatestAttemptResult(
    userId: string,
    slug: string,
  ): Promise<Record<string, any>> {
    const cacheKey = `${userId}:${slug}:latest`;
    const now = Date.now();

    const cached = this.attemptResultCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const existingPromise = this.attemptResultPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      const test = await this.findPublishedTest(slug);

      // Single database roundtrip raw JOIN query using a fast index-backed subquery to find the latest attempt
      const rows = await this.prisma.$queryRaw<AttemptResultRow[]>(Prisma.sql`
        SELECT 
          pa.id as "attempt_id",
          pa.public_id as "attempt_public_id",
          pa.user_id as "attempt_user_id",
          pa.test_id as "attempt_test_id",
          pa.mode as "attempt_mode",
          pa.status as "attempt_status",
          pa.correct_count as "attempt_correct_count",
          pa.total_count as "attempt_total_count",
          pa.scaled_score as "attempt_scaled_score",
          pa.duration_seconds as "attempt_duration_seconds",
          pa.started_at as "attempt_started_at",
          pa.completed_at as "attempt_completed_at",
          
          aa.selected_answer as "answer_selected_answer",
          aa.is_correct as "answer_is_correct",
          aa.is_flagged as "answer_is_flagged",
          aa.time_spent_ms as "answer_time_spent_ms",
          aa.answered_at as "answer_answered_at",
          
          q.id as "question_id",
          q.test_part_id as "question_test_part_id",
          q.group_id as "question_group_id",
          q.question_number as "question_question_number",
          q.stem as "question_stem",
          q.option_a as "question_option_a",
          q.option_b as "question_option_b",
          q.option_c as "question_option_c",
          q.option_d as "question_option_d",
          q.correct_answer as "question_correct_answer",
          q.explanation as "question_explanation",
          q.image_url as "question_image_url",
          q.audio_url as "question_audio_url",
          q.created_at as "question_created_at",
          
          tp.id as "part_id",
          tp.part_number as "part_part_number",
          tp.section as "part_section",
          tp.label as "part_label",
          tp.description as "part_description",
          tp.question_count as "part_question_count",
          
          qg.id as "group_id",
          qg.passage as "group_passage",
          qg.audio_url as "group_audio_url",
          qg.image_url as "group_image_url",
          qg.transcript as "group_transcript",
          qg.sort_order as "group_sort_order"
        FROM practice_attempts pa
        LEFT JOIN attempt_answers aa ON pa.id = aa.attempt_id
        LEFT JOIN questions q ON aa.question_id = q.id
        LEFT JOIN test_parts tp ON q.test_part_id = tp.id
        LEFT JOIN question_groups qg ON q.group_id = qg.id
        WHERE pa.id = (
          SELECT id FROM practice_attempts
          WHERE user_id = ${userId}::uuid
            AND test_id = ${test.id}
            AND status = 'COMPLETED'
          ORDER BY completed_at DESC
          LIMIT 1
        )
        ORDER BY q.question_number ASC, q.id ASC
      `);

      const attempt = this.reconstructAttempt(rows, test);

      if (!attempt) {
        throw new NotFoundException('Không tìm thấy kết quả làm bài.');
      }

      const result = this.toAttemptResult(attempt);

      this.attemptResultCache.set(cacheKey, {
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
        value: result,
      });

      return result;
    })();

    this.attemptResultPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.attemptResultPromises.delete(cacheKey);
    }
  }

  async getAttemptResult(
    userId: string,
    slug: string,
    attemptId: string,
  ): Promise<Record<string, any>> {
    const cacheKey = `${userId}:${slug}:${attemptId}`;
    const now = Date.now();

    const cached = this.attemptResultCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const existingPromise = this.attemptResultPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      const test = await this.findPublishedTest(slug);

      // Single database roundtrip raw JOIN query filtering by public UUID and userId
      const rows = await this.prisma.$queryRaw<AttemptResultRow[]>(Prisma.sql`
        SELECT 
          pa.id as "attempt_id",
          pa.public_id as "attempt_public_id",
          pa.user_id as "attempt_user_id",
          pa.test_id as "attempt_test_id",
          pa.mode as "attempt_mode",
          pa.status as "attempt_status",
          pa.correct_count as "attempt_correct_count",
          pa.total_count as "attempt_total_count",
          pa.scaled_score as "attempt_scaled_score",
          pa.duration_seconds as "attempt_duration_seconds",
          pa.started_at as "attempt_started_at",
          pa.completed_at as "attempt_completed_at",
          
          aa.selected_answer as "answer_selected_answer",
          aa.is_correct as "answer_is_correct",
          aa.is_flagged as "answer_is_flagged",
          aa.time_spent_ms as "answer_time_spent_ms",
          aa.answered_at as "answer_answered_at",
          
          q.id as "question_id",
          q.test_part_id as "question_test_part_id",
          q.group_id as "question_group_id",
          q.question_number as "question_question_number",
          q.stem as "question_stem",
          q.option_a as "question_option_a",
          q.option_b as "question_option_b",
          q.option_c as "question_option_c",
          q.option_d as "question_option_d",
          q.correct_answer as "question_correct_answer",
          q.explanation as "question_explanation",
          q.image_url as "question_image_url",
          q.audio_url as "question_audio_url",
          q.created_at as "question_created_at",
          
          tp.id as "part_id",
          tp.part_number as "part_part_number",
          tp.section as "part_section",
          tp.label as "part_label",
          tp.description as "part_description",
          tp.question_count as "part_question_count",
          
          qg.id as "group_id",
          qg.passage as "group_passage",
          qg.audio_url as "group_audio_url",
          qg.image_url as "group_image_url",
          qg.transcript as "group_transcript",
          qg.sort_order as "group_sort_order"
        FROM practice_attempts pa
        LEFT JOIN attempt_answers aa ON pa.id = aa.attempt_id
        LEFT JOIN questions q ON aa.question_id = q.id
        LEFT JOIN test_parts tp ON q.test_part_id = tp.id
        LEFT JOIN question_groups qg ON q.group_id = qg.id
        WHERE pa.public_id = ${attemptId}::uuid
          AND pa.user_id = ${userId}::uuid
          AND pa.status = 'COMPLETED'
        ORDER BY q.question_number ASC, q.id ASC
      `);

      const attempt = this.reconstructAttempt(rows, test);

      if (!attempt) {
        throw new NotFoundException('Không tìm thấy kết quả làm bài.');
      }

      const result = this.toAttemptResult(attempt);

      this.attemptResultCache.set(cacheKey, {
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
        value: result,
      });

      return result;
    })();

    this.attemptResultPromises.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.attemptResultPromises.delete(cacheKey);
    }
  }

  private reconstructAttempt(
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

  private async findPublishedTest(slug: string) {
    try {
      const snapshot = await this.getTestsSnapshot();
      const cachedTest = snapshot.tests.find((item) => item.slug === slug);
      if (cachedTest) {
        return cachedTest;
      }
    } catch {
      // Fallback
    }

    const test = await this.prisma.test.findUnique({
      where: { slug },
      include: TEST_INCLUDE,
    });

    if (!test || !test.isPublished) {
      throw new NotFoundException('Không tìm thấy bài luyện TOEIC.');
    }

    return test;
  }

  private async getTestsSnapshot(): Promise<PracticeTestsSnapshot> {
    const now = Date.now();

    if (this.testsSnapshotCache && this.testsSnapshotCache.expiresAt > now) {
      return this.testsSnapshotCache.value;
    }

    if (!this.testsSnapshotPromise) {
      this.testsSnapshotPromise = Promise.all([
        this.prisma.test.findMany({
          where: { isPublished: true },
          include: TEST_INCLUDE,
          orderBy: { slug: 'asc' },
        }),
        this.prisma.practiceAttempt.groupBy({
          by: ['testId'],
          _count: { _all: true },
          where: { status: 'COMPLETED' },
        }),
      ])
        .then(([tests, attemptCounts]) => ({
          tests,
          countsByTestId: new Map(
            attemptCounts.map((item) => [item.testId, item._count._all]),
          ),
        }))
        .then((value) => {
          this.testsSnapshotCache = {
            expiresAt: Date.now() + PRACTICE_TEST_CACHE_TTL_MS,
            value,
          };
          return value;
        })
        .finally(() => {
          this.testsSnapshotPromise = null;
        });
    }

    return this.testsSnapshotPromise;
  }

  private findTestInSnapshot(tests: TestWithParts[], slug: string) {
    const test = tests.find((item) => item.slug === slug);

    if (!test) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y bÃ i luyá»‡n TOEIC.');
    }

    return test;
  }

  private toPracticeTest(test: TestWithParts, attempts: number) {
    return {
      id: test.slug,
      title: this.toDisplayTitle(test),
      subtitle: test.subtitle ?? '',
      type: this.toDisplayType(test.type),
      shortType: test.shortType,
      minutes: test.durationMinutes,
      questions: test.totalQuestions,
      access: this.toDisplayAccess(test.accessLevel),
      status: 'New',
      attempts,
      parts: test.parts.map((part) => ({
        id: this.toPartId(part.partNumber),
        label: part.label,
        description: part.description,
        questions: part.questionCount,
      })),
    };
  }

  private toPracticeTestWithAttempts(
    test: TestWithParts,
    attempts: number,
    recentAttempts: AttemptSummaryWithParts[],
  ) {
    const summaries = recentAttempts.map((attempt) =>
      this.toAttemptSummary(attempt),
    );
    const latestAttempt = summaries[0];

    return {
      ...this.toPracticeTest(test, attempts),
      status: summaries.length > 0 ? 'Completed' : 'New',
      recentAttempts: summaries,
      completedAt: latestAttempt?.attemptedAt,
    };
  }

  private findRecentAttemptSummaries(
    userId: string,
    where: Prisma.PracticeAttemptWhereInput,
    take: number,
  ) {
    return this.prisma.practiceAttempt.findMany({
      where: {
        ...where,
        userId,
        status: 'COMPLETED',
      },
      include: ATTEMPT_SUMMARY_INCLUDE,
      orderBy: { completedAt: 'desc' },
      take,
    });
  }

  private groupAttemptsByTestId(attempts: AttemptSummaryWithParts[]) {
    const attemptsByTestId = new Map<number, AttemptSummaryWithParts[]>();

    attempts.forEach((attempt) => {
      const current = attemptsByTestId.get(attempt.testId) ?? [];
      attemptsByTestId.set(attempt.testId, [...current, attempt]);
    });

    return attemptsByTestId;
  }

  private toToeicQuestion(
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
      partId: this.toPartId(question.testPart.partNumber),
      questionNumber: question.questionNumber,
      passage: question.group?.passage ?? undefined,
      passageGroupId: question.groupId?.toString(),
      stem: question.stem,
      options: [
        { label: 'A', text: question.optionA },
        { label: 'B', text: question.optionB },
        { label: 'C', text: question.optionC },
        ...(this.hasOptionD(question)
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

  private toAttemptSummary(attempt: AttemptSummarySource) {
    const completedAt = attempt.completedAt ?? attempt.startedAt;
    const scopeLabels = this.getScopeLabels(attempt);
    const testTitle = this.toDisplayTitle(attempt.test);

    return {
      id: attempt.publicId,
      testId: attempt.test.slug,
      testTitle: `${testTitle} ${attempt.test.subtitle ?? ''}`.trim(),
      attemptedAt: this.formatDate(completedAt),
      mode: attempt.mode === 'FULL_TEST' ? 'Full test' : 'Practice',
      scopeLabels,
      correct: attempt.correctCount,
      total: attempt.totalCount,
      durationSeconds: attempt.durationSeconds,
      detailHref: `/practice/${attempt.test.slug}/results/${attempt.publicId}`,
      scaledScore: this.hasCompleteToeicScoreScope(
        attempt.answers.map((answer) => answer.question),
      )
        ? (attempt.scaledScore ?? undefined)
        : undefined,
      timestamp: completedAt.toISOString(),
    };
  }

  private toAttemptResult(
    attempt: AttemptWithAnswers,
    timeLimitMinutes?: number,
  ) {
    const summary = this.toAttemptSummary(attempt);
    const answers = Object.fromEntries(
      attempt.answers
        .filter((answer) => answer.selectedAnswer)
        .map((answer) => [answer.questionId.toString(), answer.selectedAnswer]),
    );
    const flaggedIds = attempt.answers
      .filter((answer) => answer.isFlagged)
      .map((answer) => answer.questionId.toString());
    const questions = attempt.answers.map((answer) =>
      this.toToeicQuestion(answer.question),
    );

    return {
      test: this.toPracticeTest(attempt.test, 0),
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
        parts: this.getPartIds(attempt),
        timeLimit: timeLimitMinutes,
      },
    };
  }

  private parseQuestionIds(questionIds: string[]) {
    try {
      const uniqueIds = Array.from(new Set(questionIds));
      return uniqueIds.map((id) => BigInt(id));
    } catch {
      throw new BadRequestException('Danh sách câu hỏi không hợp lệ.');
    }
  }

  private getSelectedAnswer(
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
      ...(this.hasOptionD(question) ? ['D'] : []),
    ];
    if (!allowedAnswers.includes(selectedAnswer)) {
      throw new BadRequestException('Đáp án gửi lên không hợp lệ.');
    }

    return selectedAnswer;
  }

  private calculateScaledScore(
    questions: QuestionWithContext[],
    answers: Record<string, string>,
  ) {
    const listening = questions.filter((question) =>
      [1, 2, 3, 4].includes(question.testPart.partNumber),
    );
    const reading = questions.filter((question) =>
      [5, 6, 7].includes(question.testPart.partNumber),
    );

    if (!this.hasCompleteToeicScoreScope(questions)) {
      return null;
    }

    const listeningCorrect = listening.filter(
      (question) => answers[question.id.toString()] === question.correctAnswer,
    ).length;
    const readingCorrect = reading.filter(
      (question) => answers[question.id.toString()] === question.correctAnswer,
    ).length;

    return (
      this.estimateSectionScore(listeningCorrect) +
      this.estimateSectionScore(readingCorrect)
    );
  }

  private estimateSectionScore(correct: number) {
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
    const progress =
      (boundedCorrect - previous.raw) / (next.raw - previous.raw);
    const scaled = previous.scaled + (next.scaled - previous.scaled) * progress;

    return Math.max(5, Math.min(495, Math.round(scaled / 5) * 5));
  }

  private hasCompleteToeicScoreScope(
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

  private getScopeLabels(attempt: AttemptSummarySource) {
    if (attempt.totalCount >= attempt.test.totalQuestions) {
      return [];
    }

    return this.getPartIds(attempt).map((partId) =>
      partId.replace('part-', 'Part '),
    );
  }

  private getPartIds(attempt: AttemptSummarySource) {
    const partIds = new Set(
      attempt.answers.map((answer) =>
        this.toPartId(answer.question.testPart.partNumber),
      ),
    );

    return Array.from(partIds).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  private toDisplayType(type: string) {
    return type === 'SPEAKING_WRITING'
      ? 'Speaking & Writing'
      : 'Listening & Reading';
  }

  private toDisplayAccess(accessLevel: string) {
    return accessLevel === 'PRO' ? 'Pro' : 'Free';
  }

  private hasOptionD(question: {
    optionD: string | null;
    testPart: { partNumber: number };
  }) {
    return question.testPart.partNumber === 1 || Boolean(question.optionD);
  }

  private sortTestsByDisplayNumber(tests: TestWithParts[]) {
    return [...tests].sort((a, b) => {
      const aNumber = this.getDisplayNumber(a);
      const bNumber = this.getDisplayNumber(b);

      if (aNumber !== bNumber) {
        return aNumber - bNumber;
      }

      return a.slug.localeCompare(b.slug, undefined, { numeric: true });
    });
  }

  private toDisplayTitle(test: Pick<TestWithParts, 'slug' | 'title'>) {
    return `Practice Toeic Test ${this.getDisplayNumber(test)}`;
  }

  private getDisplayNumber(test: Pick<TestWithParts, 'slug' | 'title'>) {
    const slugMatch = test.slug.match(/(\d+)$/);
    const titleMatch = test.title.match(/(\d+)(?!.*\d)/);
    const value = Number(slugMatch?.[1] ?? titleMatch?.[1] ?? 0);

    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  private toPartId(partNumber: number) {
    return `part-${partNumber}`;
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
