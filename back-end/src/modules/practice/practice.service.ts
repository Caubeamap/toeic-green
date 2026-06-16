import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

const ATTEMPT_INCLUDE = {
  test: {
    include: TEST_INCLUDE,
  },
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

type TestWithParts = Prisma.TestGetPayload<{ include: typeof TEST_INCLUDE }>;
type QuestionWithContext = Prisma.QuestionGetPayload<{
  include: typeof QUESTIONS_INCLUDE;
}>;
type ExamQuestionWithContext = Prisma.QuestionGetPayload<{
  select: typeof EXAM_QUESTION_SELECT;
}>;
type ToeicQuestionSource = QuestionWithContext | ExamQuestionWithContext;
type AttemptWithAnswers = Prisma.PracticeAttemptGetPayload<{
  include: typeof ATTEMPT_INCLUDE;
}>;

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async listTests() {
    const tests = await this.prisma.test.findMany({
      where: { isPublished: true },
      include: TEST_INCLUDE,
      orderBy: { slug: 'asc' },
    });

    const attemptCounts = await this.prisma.practiceAttempt.groupBy({
      by: ['testId'],
      _count: { _all: true },
      where: { status: 'COMPLETED' },
    });
    const countsByTestId = new Map(
      attemptCounts.map((item) => [item.testId, item._count._all]),
    );

    return this.sortTestsByDisplayNumber(tests).map((test) =>
      this.toPracticeTest(test, countsByTestId.get(test.id) ?? 0),
    );
  }

  async getTestBySlug(slug: string) {
    const test = await this.findPublishedTest(slug);
    const attempts = await this.prisma.practiceAttempt.count({
      where: {
        testId: test.id,
        status: 'COMPLETED',
      },
    });

    return this.toPracticeTest(test, attempts);
  }

  async listQuestions(slug: string) {
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

    return questions.map((question) =>
      this.toToeicQuestion(question, { includeAnswer: false }),
    );
  }

  async listRecentAttempts(userId: string) {
    const attempts = await this.prisma.practiceAttempt.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: ATTEMPT_INCLUDE,
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

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

      return tx.practiceAttempt.findUniqueOrThrow({
        where: { id: createdAttempt.id },
        include: ATTEMPT_INCLUDE,
      });
    });

    return this.toAttemptResult(attempt, submitAttemptDto.timeLimitMinutes);
  }

  async getLatestAttemptResult(userId: string, slug: string) {
    const test = await this.findPublishedTest(slug);
    const attempt = await this.prisma.practiceAttempt.findFirst({
      where: {
        userId,
        testId: test.id,
        status: 'COMPLETED',
      },
      include: ATTEMPT_INCLUDE,
      orderBy: { completedAt: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy kết quả làm bài.');
    }

    return this.toAttemptResult(attempt);
  }

  async getAttemptResult(userId: string, slug: string, attemptId: string) {
    const test = await this.findPublishedTest(slug);
    const attempt = await this.prisma.practiceAttempt.findFirst({
      where: {
        userId,
        testId: test.id,
        publicId: attemptId,
        status: 'COMPLETED',
      },
      include: ATTEMPT_INCLUDE,
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy kết quả làm bài.');
    }

    return this.toAttemptResult(attempt);
  }

  private async findPublishedTest(slug: string) {
    const test = await this.prisma.test.findUnique({
      where: { slug },
      include: TEST_INCLUDE,
    });

    if (!test || !test.isPublished) {
      throw new NotFoundException('Không tìm thấy bài luyện TOEIC.');
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

  private toAttemptSummary(attempt: AttemptWithAnswers) {
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
      scaledScore:
        this.hasCompleteToeicScoreScope(
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

    return Math.max(
      5,
      Math.min(495, Math.round(scaled / 5) * 5),
    );
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

  private getScopeLabels(attempt: AttemptWithAnswers) {
    if (attempt.totalCount >= attempt.test.totalQuestions) {
      return [];
    }

    return this.getPartIds(attempt).map((partId) =>
      partId.replace('part-', 'Part '),
    );
  }

  private getPartIds(attempt: AttemptWithAnswers) {
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
