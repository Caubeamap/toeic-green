require('dotenv/config');

const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const crawlerOutputDir = path.resolve(__dirname, '../../toeic-crawler/output');
const partDescriptions = {
  1: 'Photographs',
  2: 'Question-Response',
  3: 'Conversations',
  4: 'Short Talks',
  5: 'Incomplete Sentences',
  6: 'Text Completion',
  7: 'Reading Comprehension',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPartPath(testDir, partNumber) {
  const section = partNumber <= 4 ? 'listening' : 'reading';
  return path.join(testDir, section, `part${partNumber}.json`);
}

function getStem(question, partNumber) {
  const text = normalizeText(question.text);
  if (text) {
    return text;
  }

  if (partNumber === 1) {
    return 'Look at the photograph. Which statement best describes what you see?';
  }

  if (partNumber === 2) {
    return 'Listen to the question and choose the best response.';
  }

  return `Question ${question.number}`;
}

function parseChoices(choices) {
  const labels = ['A', 'B', 'C', 'D'];
  const parsed = {};

  labels.forEach((label, index) => {
    const raw =
      typeof choices?.[index] === 'string' ? choices[index].trim() : '';
    const match = raw.match(/^([A-D])\.\s*(.*)$/i);
    parsed[label] = match
      ? match[2].trim()
      : raw.replace(/^[A-D]\.\s*/i, '').trim();
  });

  return parsed;
}

function getContextKey(question) {
  const values = [
    normalizeText(question.passage),
    normalizeText(question.audio_url),
    normalizeText(question.image_url),
    normalizeText(question.transcript),
  ];

  if (values.every((value) => value === null)) {
    return null;
  }

  return values.map((value) => value ?? '').join('\u0000');
}

async function seedTest(testInfo) {
  const testDir = path.join(crawlerOutputDir, testInfo.slug);
  if (!fs.existsSync(testDir)) {
    return { slug: testInfo.slug, skipped: true, reason: 'missing directory' };
  }

  const partFiles = Array.from({ length: 7 }, (_, index) =>
    getPartPath(testDir, index + 1),
  );

  if (partFiles.some((filePath) => !fs.existsSync(filePath))) {
    return { slug: testInfo.slug, skipped: true, reason: 'missing part file' };
  }

  const test = await prisma.test.upsert({
    where: { slug: testInfo.slug },
    create: {
      slug: testInfo.slug,
      title: testInfo.title,
      subtitle: 'TOEIC Green Practice',
      type: 'LISTENING_READING',
      shortType: 'L & R',
      durationMinutes: testInfo.duration_minutes ?? 120,
      totalQuestions: testInfo.total_questions ?? 200,
      accessLevel: 'FREE',
      isPublished: true,
    },
    update: {
      title: testInfo.title,
      subtitle: 'TOEIC Green Practice',
      type: 'LISTENING_READING',
      shortType: 'L & R',
      durationMinutes: testInfo.duration_minutes ?? 120,
      totalQuestions: testInfo.total_questions ?? 200,
      accessLevel: 'FREE',
      isPublished: true,
    },
  });

  let questionCount = 0;

  for (let partNumber = 1; partNumber <= 7; partNumber += 1) {
    const source = readJson(getPartPath(testDir, partNumber));
    const part = await prisma.testPart.upsert({
      where: {
        testId_partNumber: {
          testId: test.id,
          partNumber,
        },
      },
      create: {
        testId: test.id,
        partNumber,
        section: source.section,
        label: `Part ${partNumber}`,
        description: partDescriptions[partNumber],
        questionCount: source.num_questions,
      },
      update: {
        section: source.section,
        label: `Part ${partNumber}`,
        description: partDescriptions[partNumber],
        questionCount: source.num_questions,
      },
    });

    const groupIdsByKey = new Map();
    const sourceQuestions = source.questions ?? [];

    await prisma.question.deleteMany({
      where: { testPartId: part.id },
    });

    await prisma.questionGroup.deleteMany({
      where: { testPartId: part.id },
    });

    for (const question of sourceQuestions) {
      const contextKey = getContextKey(question);
      if (contextKey && !groupIdsByKey.has(contextKey)) {
        const group = await prisma.questionGroup.create({
          data: {
            testPartId: part.id,
            passage: normalizeText(question.passage),
            audioUrl: normalizeText(question.audio_url),
            imageUrl: normalizeText(question.image_url),
            transcript: normalizeText(question.transcript),
            sortOrder: question.number,
          },
        });
        groupIdsByKey.set(contextKey, group.id);
      }
    }

    if (sourceQuestions.length > 0) {
      await prisma.question.createMany({
        data: sourceQuestions.map((question) => {
          const choices = parseChoices(question.choices);
          const contextKey = getContextKey(question);
          const groupId = contextKey ? groupIdsByKey.get(contextKey) : null;

          return {
            testPartId: part.id,
            groupId,
            questionNumber: question.number,
            stem: getStem(question, partNumber),
            optionA: choices.A,
            optionB: choices.B,
            optionC: choices.C,
            optionD: choices.D || null,
            correctAnswer: question.correct_answer,
            explanation: normalizeText(question.explanation),
            imageUrl: normalizeText(question.image_url),
            audioUrl: normalizeText(question.audio_url),
          };
        }),
      });
      questionCount += sourceQuestions.length;
    }
  }

  return { slug: testInfo.slug, skipped: false, questionCount };
}

async function main() {
  const index = readJson(path.join(crawlerOutputDir, 'tests_index.json'));
  const completed = [];
  const skipped = [];

  for (const testInfo of index.tests) {
    const result = await seedTest(testInfo);
    if (result.skipped) {
      skipped.push(result);
    } else {
      completed.push(result);
    }
  }

  const totalQuestions = completed.reduce(
    (sum, item) => sum + item.questionCount,
    0,
  );

  console.log(
    `Seeded ${completed.length} TOEIC tests with ${totalQuestions} questions.`,
  );

  if (skipped.length > 0) {
    console.log(
      `Skipped ${skipped.length} tests without complete crawler output: ${skipped
        .map((item) => item.slug)
        .join(', ')}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
