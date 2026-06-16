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
      orderBy: { id: 'asc' },
    });

    const attemptCounts = await this.prisma.practiceAttempt.groupBy({
      by: ['testId'],
      _count: { _all: true },
      where: { status: 'COMPLETED' },
    });
    const countsByTestId = new Map(
      attemptCounts.map((item) => [item.testId, item._count._all]),
    );

    return tests.map((test) =>
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
      include: QUESTIONS_INCLUDE,
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
      title: test.title,
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
    question: QuestionWithContext,
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
        ...(question.optionD ? [{ label: 'D', text: question.optionD }] : []),
      ],
      image_url: question.imageUrl ?? question.group?.imageUrl ?? null,
      audio_url: question.audioUrl ?? question.group?.audioUrl ?? null,
      transcript: question.group?.transcript ?? null,
    };

    if (options.includeAnswer) {
      dto.correctAnswer = question.correctAnswer;
      dto.explanation = question.explanation;
    }

    return dto;
  }

  private toAttemptSummary(attempt: AttemptWithAnswers) {
    const completedAt = attempt.completedAt ?? attempt.startedAt;
    const scopeLabels = this.getScopeLabels(attempt);

    return {
      id: attempt.publicId,
      testId: attempt.test.slug,
      testTitle: `${attempt.test.title} ${attempt.test.subtitle ?? ''}`.trim(),
      attemptedAt: this.formatDate(completedAt),
      mode: attempt.mode === 'FULL_TEST' ? 'Full test' : 'Practice',
      scopeLabels,
      correct: attempt.correctCount,
      total: attempt.totalCount,
      durationSeconds: attempt.durationSeconds,
      detailHref: `/practice/${attempt.test.slug}/results/${attempt.publicId}`,
      scaledScore: attempt.scaledScore ?? undefined,
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

    const allowedAnswers = ['A', 'B', 'C', ...(question.optionD ? ['D'] : [])];
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

    if (listening.length === 0 || reading.length === 0) {
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
    if (correct === 0) {
      return 5;
    }

    if (correct <= 10) {
      return 5 + (correct - 1) * 5;
    }

    if (correct <= 50) {
      return 50 + (correct - 10) * 5;
    }

    if (correct <= 90) {
      return 250 + (correct - 50) * 5;
    }

    return Math.min(495, Math.round((450 + (correct - 90) * 4.5) / 5) * 5);
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
