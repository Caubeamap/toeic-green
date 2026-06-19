require('dotenv/config');
// Seeds zenlish ETS 2026 TOEIC tests into the database.
// Media files must already be uploaded to R2 (run upload-zenlish-media-to-r2.cjs first).
// Usage: node prisma/scripts/seed-zenlish-tests.cjs

const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const r2PublicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
if (!r2PublicUrl) {
  throw new Error('R2_PUBLIC_URL environment variable is not defined');
}

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
pool.on('error', (err) => console.error('Pool idle error', err.message));

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ZENLISH_DIR = path.resolve(
  __dirname,
  '../../../toeic-crawler/output/zenlish',
);

const partDescriptions = {
  1: 'Photographs',
  2: 'Question-Response',
  3: 'Conversations',
  4: 'Short Talks',
  5: 'Incomplete Sentences',
  6: 'Text Completion',
  7: 'Reading Comprehension',
};

// --- Format helpers ---

function crawlerSlugToWebSlug(crawlerSlug) {
  // "test-1-ets-2026" → "ets-2026-test-1"
  const match = crawlerSlug.match(/^test-(\d+)-ets-(\d+)$/);
  if (!match) return crawlerSlug;
  return `ets-${match[2]}-test-${match[1]}`;
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function localPathToR2Url(localPath) {
  if (!localPath || typeof localPath !== 'string') return null;

  const paths = localPath.split(',');
  const urls = paths.map((p) => {
    const cleaned = p.trim().replace(/\\/g, '/');
    const marker = 'output/zenlish/';
    const idx = cleaned.indexOf(marker);
    if (idx === -1) return p.trim();
    const relPath = cleaned.slice(idx + marker.length);
    const key = `toeic/zenlish/${relPath}`;
    return `${r2PublicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  });

  return urls.join(',');
}

function parseCorrectAnswer(raw) {
  if (!raw) return '';
  // "(B)" → "B", or "B" → "B"
  const match = raw.match(/\(?([A-D])\)?/i);
  return match ? match[1].toUpperCase() : raw.trim().toUpperCase();
}

function parseChoices(choices) {
  const labels = ['A', 'B', 'C', 'D'];
  const parsed = {};

  labels.forEach((label, index) => {
    const raw =
      typeof choices?.[index] === 'string' ? choices[index].trim() : '';

    // Zenlish format: "(A) text" or "(A)"
    let match = raw.match(/^\(([A-D])\)\s*(.*)$/i);
    if (match) {
      parsed[label] = match[2].trim();
      return;
    }

    // Fallback study4 format: "A. text" or "A."
    match = raw.match(/^([A-D])\.\s*(.*)$/i);
    if (match) {
      parsed[label] = match[2].trim();
      return;
    }

    // Raw value without known prefix
    parsed[label] = raw;
  });

  return parsed;
}

function getStem(question, partNumber) {
  const text = normalizeText(question.text);
  if (text) return text;

  if (partNumber === 1) {
    return 'Look at the photograph. Which statement best describes what you see?';
  }
  if (partNumber === 2) {
    return 'Listen to the question and choose the best response.';
  }
  return `Question ${question.number}`;
}

function getContextKey(question) {
  const values = [
    normalizeText(question.passage),
    normalizeText(question.audio_url),
    normalizeText(question.image_url),
    normalizeText(question.transcript),
  ];

  if (values.every((v) => v === null)) return null;
  return values.map((v) => v ?? '').join('\0');
}

// --- Main ---

async function seedTest(testEntry) {
  const crawlerSlug = testEntry.slug;
  const webSlug = crawlerSlugToWebSlug(crawlerSlug);
  const testDir = path.join(ZENLISH_DIR, crawlerSlug);

  if (!fs.existsSync(testDir)) {
    return { slug: webSlug, skipped: true, reason: 'missing directory' };
  }

  // Check all 7 part files exist
  for (let p = 1; p <= 7; p++) {
    const section = p <= 4 ? 'listening' : 'reading';
    const partPath = path.join(testDir, section, `part${p}.json`);
    if (!fs.existsSync(partPath)) {
      return {
        slug: webSlug,
        skipped: true,
        reason: `missing part${p}.json`,
      };
    }
  }

  const test = await prisma.test.upsert({
    where: { slug: webSlug },
    create: {
      slug: webSlug,
      title: testEntry.title,
      subtitle: 'TOEIC Green Practice',
      type: 'LISTENING_READING',
      shortType: 'L & R',
      durationMinutes: testEntry.duration_minutes ?? 120,
      totalQuestions: testEntry.total_questions ?? 200,
      accessLevel: 'FREE',
      isPublished: true,
    },
    update: {
      title: testEntry.title,
      subtitle: 'TOEIC Green Practice',
      type: 'LISTENING_READING',
      shortType: 'L & R',
      durationMinutes: testEntry.duration_minutes ?? 120,
      totalQuestions: testEntry.total_questions ?? 200,
      accessLevel: 'FREE',
      isPublished: true,
    },
  });

  let questionCount = 0;

  for (let partNumber = 1; partNumber <= 7; partNumber++) {
    const section = partNumber <= 4 ? 'listening' : 'reading';
    const partPath = path.join(testDir, section, `part${partNumber}.json`);
    const source = JSON.parse(fs.readFileSync(partPath, 'utf8'));

    const part = await prisma.testPart.upsert({
      where: {
        testId_partNumber: { testId: test.id, partNumber },
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

    const sourceQuestions = source.questions ?? [];

    // Delete existing data for idempotent re-seed
    await prisma.question.deleteMany({ where: { testPartId: part.id } });
    await prisma.questionGroup.deleteMany({ where: { testPartId: part.id } });

    // Build groups from shared context (audio/image/passage/transcript)
    const groupIdsByKey = new Map();

    for (const question of sourceQuestions) {
      const contextKey = getContextKey(question);
      if (contextKey && !groupIdsByKey.has(contextKey)) {
        const group = await prisma.questionGroup.create({
          data: {
            testPartId: part.id,
            passage: normalizeText(question.passage),
            audioUrl: localPathToR2Url(question.audio_url),
            imageUrl: localPathToR2Url(question.image_url),
            transcript: normalizeText(question.transcript),
            sortOrder: question.number,
          },
        });
        groupIdsByKey.set(contextKey, group.id);
      }
    }

    // Fix duplicate question numbers (crawler data errors)
    const seenNumbers = new Set();
    let nextFix =
      source.questions.length > 0
        ? Math.max(...source.questions.map((q) => q.number)) + 1
        : 1;
    for (const question of sourceQuestions) {
      if (seenNumbers.has(question.number)) {
        const oldNum = question.number;
        question.number = nextFix++;
        console.log(
          `    FIX: part${partNumber} duplicate q${oldNum} → q${question.number}`,
        );
      }
      seenNumbers.add(question.number);
    }

    // Batch insert questions
    if (sourceQuestions.length > 0) {
      await prisma.question.createMany({
        data: sourceQuestions.map((question) => {
          const choices = parseChoices(question.choices);
          const contextKey = getContextKey(question);
          const groupId = contextKey
            ? (groupIdsByKey.get(contextKey) ?? null)
            : null;

          return {
            testPartId: part.id,
            groupId,
            questionNumber: question.number,
            stem: getStem(question, partNumber),
            optionA: choices.A,
            optionB: choices.B,
            optionC: choices.C,
            optionD: choices.D || null,
            correctAnswer: parseCorrectAnswer(question.correct_answer),
            explanation: normalizeText(question.explanation),
            imageUrl: localPathToR2Url(question.image_url),
            audioUrl: localPathToR2Url(question.audio_url),
          };
        }),
      });
      questionCount += sourceQuestions.length;
    }
  }

  return { slug: webSlug, skipped: false, questionCount };
}

async function main() {
  const indexPath = path.join(ZENLISH_DIR, 'tests_index.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Zenlish tests_index.json not found: ${indexPath}`);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  console.log(`Found ${index.tests.length} zenlish ETS 2026 tests to seed.\n`);

  const completed = [];
  const skipped = [];

  for (const testEntry of index.tests) {
    const result = await seedTest(testEntry);
    if (result.skipped) {
      skipped.push(result);
      console.log(`  SKIP ${result.slug}: ${result.reason}`);
    } else {
      completed.push(result);
      console.log(`  OK   ${result.slug}: ${result.questionCount} questions`);
    }
  }

  const totalQuestions = completed.reduce(
    (sum, item) => sum + item.questionCount,
    0,
  );

  console.log(
    `\nSeeded ${completed.length} ETS 2026 tests with ${totalQuestions} questions.`,
  );

  if (skipped.length > 0) {
    console.log(
      `Skipped ${skipped.length} tests: ${skipped.map((s) => s.slug).join(', ')}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
