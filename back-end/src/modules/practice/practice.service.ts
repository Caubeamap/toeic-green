import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pruneExpiredEntries } from '../../common/utils/prune-expired-cache';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import {
  TEST_INCLUDE,
  QUESTIONS_INCLUDE,
  EXAM_QUESTION_SELECT,
  TEST_DETAIL_ATTEMPT_LIMIT,
  PRACTICE_TEST_CACHE_TTL_MS,
  AttemptWithAnswers,
  AttemptBaseWithParts,
  SummaryRow,
  PracticeTestsSnapshot,
  UserStatsRow,
  AttemptResultRow,
} from './practice.queries';
import {
  reconstructAttempt,
  findTestInSnapshot,
  toPracticeTest,
  toPracticeTestWithAttempts,
  toAttemptBaseWithParts,
  groupAttemptsByTestId,
  toToeicQuestion,
  toAttemptSummary,
  toAttemptResult,
  parseQuestionIds,
  getSelectedAnswer,
  calculateScaledScore,
  sortTestsByDisplayNumber,
} from './practice.mappers';

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

  // Cache danh sách đề kèm tiến độ theo user. Chỉ đổi khi user nộp bài (đã
  // invalidate trong submitAttempt) hoặc admin đổi đề (snapshot TTL 60s) → TTL 60s
  // an toàn, loại bỏ truy vấn SQL DISTINCT ON per-request cho mỗi lần duyệt /tests.
  private userTestsCache = new Map<
    string,
    { expiresAt: number; value: Record<string, any>[] }
  >();
  private userTestsPromises = new Map<string, Promise<Record<string, any>[]>>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Pre-warm cache and connection pool on startup asynchronously.
    void this.prewarmPracticeCaches();
  }

  async listTests() {
    const { countsByTestId, tests } = await this.getTestsSnapshot();

    return sortTestsByDisplayNumber(tests).map((test) =>
      toPracticeTest(test, countsByTestId.get(test.id) ?? 0),
    );
  }

  async listTestsForUser(userId: string) {
    const now = Date.now();
    const cached = this.userTestsCache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // Single-flight: nhiều request đồng thời của cùng user dùng chung 1 query.
    const existing = this.userTestsPromises.get(userId);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      const [snapshot, latestAttempts] = await Promise.all([
        this.getTestsSnapshot(),
        this.findLatestAttemptSummaryByTest(userId),
      ]);
      const attemptsByTestId = groupAttemptsByTestId(latestAttempts);

      const value = sortTestsByDisplayNumber(snapshot.tests).map((test) =>
        toPracticeTestWithAttempts(
          test,
          snapshot.countsByTestId.get(test.id) ?? 0,
          attemptsByTestId.get(test.id) ?? [],
        ),
      );

      // Dọn entry hết hạn (cache phình theo số user nếu không dọn) rồi set.
      pruneExpiredEntries(this.userTestsCache, 5000);
      this.userTestsCache.set(userId, {
        expiresAt: Date.now() + 60 * 1000,
        value,
      });
      return value;
    })();

    this.userTestsPromises.set(userId, promise);
    try {
      return await promise;
    } finally {
      this.userTestsPromises.delete(userId);
    }
  }

  async getTestBySlug(slug: string) {
    const { countsByTestId, tests } = await this.getTestsSnapshot();
    const test = findTestInSnapshot(tests, slug);

    return toPracticeTest(test, countsByTestId.get(test.id) ?? 0);
  }

  async getTestBySlugForUser(userId: string, slug: string) {
    const [snapshot, recentAttempts] = await Promise.all([
      this.getTestsSnapshot(),
      this.findRecentAttemptSummaries(userId, slug, TEST_DETAIL_ATTEMPT_LIMIT),
    ]);
    const test = findTestInSnapshot(snapshot.tests, slug);

    return toPracticeTestWithAttempts(
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

      if (questions.length === 0) {
        await this.findPublishedTest(slug);
      }

      const result = questions.map((question) =>
        toToeicQuestion(question, { includeAnswer: false }),
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

  private async prewarmPracticeCaches() {
    try {
      const snapshot = await this.getTestsSnapshot();
      const batchSize = 3;

      for (let index = 0; index < snapshot.tests.length; index += batchSize) {
        const batch = snapshot.tests.slice(index, index + batchSize);
        await Promise.allSettled(
          batch.map((test) => this.listQuestions(test.slug)),
        );
      }
    } catch {
      // Startup warmup must never block the API process. The first real request
      // still populates the same caches through the normal code path.
    }
  }

  async listRecentAttempts(userId: string) {
    const attempts = await this.findRecentAttemptSummaries(
      userId,
      undefined,
      20,
    );

    return attempts.map((attempt) => toAttemptSummary(attempt));
  }

  async getUserStats(userId: string) {
    // Tổng hợp toàn bộ lượt đã hoàn thành trong một round-trip (index user_id).
    // Không cap 20 như recent → "Lượt luyện" và độ chính xác phản ánh đúng tất cả.
    const [row] = await this.prisma.$queryRaw<UserStatsRow[]>(Prisma.sql`
      SELECT
        COUNT(*)::int AS "totalAttempts",
        COALESCE(SUM(correct_count), 0)::int AS "totalCorrect",
        COALESCE(SUM(total_count), 0)::int AS "totalQuestions",
        COALESCE(SUM(duration_seconds), 0)::int AS "totalDurationSeconds",
        COALESCE(MAX(
          CASE WHEN total_count > 0
            THEN ROUND(correct_count::numeric * 100 / total_count)
            ELSE 0 END
        ), 0)::int AS "bestAccuracy",
        MAX(scaled_score)::int AS "bestScaledScore"
      FROM practice_attempts
      WHERE user_id = ${userId}::uuid
        AND status = 'COMPLETED'
    `);

    const totalAttempts = row?.totalAttempts ?? 0;
    const totalQuestions = row?.totalQuestions ?? 0;
    const totalCorrect = row?.totalCorrect ?? 0;

    return {
      totalAttempts,
      totalCorrect,
      totalQuestions,
      totalDurationSeconds: row?.totalDurationSeconds ?? 0,
      // Tỷ lệ đúng trên tổng số câu đã làm — null khi chưa có lượt nào.
      averageAccuracy:
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : null,
      bestAccuracy: totalAttempts > 0 ? (row?.bestAccuracy ?? 0) : null,
      bestScaledScore: row?.bestScaledScore ?? null,
    };
  }

  async submitAttempt(
    userId: string,
    slug: string,
    submitAttemptDto: SubmitPracticeAttemptDto,
  ) {
    const test = await this.findPublishedTest(slug);
    const questionIds = parseQuestionIds(submitAttemptDto.questionIds);
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
      const selected = getSelectedAnswer(answers, question);
      return selected === question.correctAnswer ? total + 1 : total;
    }, 0);

    const scaledScore = calculateScaledScore(questions, answers);

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
          const selectedAnswer = getSelectedAnswer(answers, question);

          return {
            attemptId: createdAttempt.id,
            questionId: question.id,
            selectedAnswer,
            isCorrect: selectedAnswer === question.correctAnswer,
            isFlagged: flaggedQuestionIds.has(question.id.toString()),
          };
        }),
      });

      return createdAttempt;
    });

    // Build the result from data already in memory (the questions loaded for
    // scoring + the created attempt row) instead of issuing a second heavy read
    // of the attempt and all its answers right after writing them. The questions
    // are already ordered by questionNumber, matching ATTEMPT_INCLUDE_LEAN.
    const attemptWithAnswers: AttemptWithAnswers = {
      ...attempt,
      test,
      answers: questions.map((question) => {
        const selectedAnswer = getSelectedAnswer(answers, question);

        return {
          attemptId: attempt.id,
          questionId: question.id,
          selectedAnswer,
          isCorrect: selectedAnswer === question.correctAnswer,
          isFlagged: flaggedQuestionIds.has(question.id.toString()),
          timeSpentMs: null,
          answeredAt: attempt.completedAt ?? attempt.startedAt,
          question,
        } as unknown as AttemptWithAnswers['answers'][number];
      }),
    };

    const result = toAttemptResult(
      attemptWithAnswers,
      submitAttemptDto.timeLimitMinutes,
    );

    this.testsSnapshotCache = null;
    // User vừa hoàn tất 1 lượt → tiến độ đề đổi → bỏ cache đề-theo-user của họ.
    this.userTestsCache.delete(userId);

    // Pre-populate attempt cache (dọn entry hết hạn: key theo attemptId là duy nhất
    // mỗi lượt nên cache phình theo tổng số lượt làm bài nếu không dọn).
    pruneExpiredEntries(this.attemptResultCache, 2000);
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

      const attempt = reconstructAttempt(rows, test);

      if (!attempt) {
        throw new NotFoundException('Không tìm thấy kết quả làm bài.');
      }

      const result = toAttemptResult(attempt);

      pruneExpiredEntries(this.attemptResultCache, 2000);
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

      const attempt = reconstructAttempt(rows, test);

      if (!attempt) {
        throw new NotFoundException('Không tìm thấy kết quả làm bài.');
      }

      const result = toAttemptResult(attempt);

      pruneExpiredEntries(this.attemptResultCache, 2000);
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

  private async findRecentAttemptSummaries(
    userId: string,
    slug: string | undefined,
    take: number,
  ): Promise<AttemptBaseWithParts[]> {
    const slugFilter = slug
      ? Prisma.sql`AND t.slug = ${slug} AND t.is_published = true`
      : Prisma.empty;

    // One round-trip: attempt + test metadata + the DISTINCT part numbers per
    // attempt (a tiny int[]), instead of joining every answer row just to derive
    // which parts the attempt covered.
    const rows = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT
        pa.id AS "id",
        pa.public_id AS "publicId",
        pa.test_id AS "testId",
        pa.mode AS "mode",
        pa.correct_count AS "correctCount",
        pa.total_count AS "totalCount",
        pa.scaled_score AS "scaledScore",
        pa.duration_seconds AS "durationSeconds",
        pa.started_at AS "startedAt",
        pa.completed_at AS "completedAt",
        t.slug AS "testSlug",
        t.title AS "testTitle",
        t.subtitle AS "testSubtitle",
        t.total_questions AS "testTotalQuestions",
        COALESCE((
          SELECT array_agg(DISTINCT tp.part_number)
          FROM attempt_answers aa
          JOIN questions q ON q.id = aa.question_id
          JOIN test_parts tp ON tp.id = q.test_part_id
          WHERE aa.attempt_id = pa.id
        ), ARRAY[]::int[]) AS "partNumbers"
      FROM practice_attempts pa
      JOIN tests t ON t.id = pa.test_id
      WHERE pa.user_id = ${userId}::uuid
        AND pa.status = 'COMPLETED'
        ${slugFilter}
      ORDER BY pa.completed_at DESC
      LIMIT ${take}
    `);

    return rows.map((row) => toAttemptBaseWithParts(row));
  }

  private async findLatestAttemptSummaryByTest(
    userId: string,
  ): Promise<AttemptBaseWithParts[]> {
    const rows = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT DISTINCT ON (pa.test_id)
        pa.id AS "id",
        pa.public_id AS "publicId",
        pa.test_id AS "testId",
        pa.mode AS "mode",
        pa.correct_count AS "correctCount",
        pa.total_count AS "totalCount",
        pa.scaled_score AS "scaledScore",
        pa.duration_seconds AS "durationSeconds",
        pa.started_at AS "startedAt",
        pa.completed_at AS "completedAt",
        t.slug AS "testSlug",
        t.title AS "testTitle",
        t.subtitle AS "testSubtitle",
        t.total_questions AS "testTotalQuestions",
        COALESCE((
          SELECT array_agg(DISTINCT tp.part_number)
          FROM attempt_answers aa
          JOIN questions q ON q.id = aa.question_id
          JOIN test_parts tp ON tp.id = q.test_part_id
          WHERE aa.attempt_id = pa.id
        ), ARRAY[]::int[]) AS "partNumbers"
      FROM practice_attempts pa
      JOIN tests t ON t.id = pa.test_id
      WHERE pa.user_id = ${userId}::uuid
        AND pa.status = 'COMPLETED'
        AND t.is_published = true
      ORDER BY pa.test_id, pa.completed_at DESC
    `);

    return rows.map((row) => toAttemptBaseWithParts(row));
  }
}
