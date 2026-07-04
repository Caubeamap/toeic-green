require('dotenv/config');
// back-end/prisma/scripts/rewrite-media-urls.cjs
// Usage:
//   node prisma/scripts/rewrite-media-urls.cjs            (dry-run: shows counts only)
//   node prisma/scripts/rewrite-media-urls.cjs --apply    (performs the UPDATE)
//
// Rewrites study4.com media URLs in the DB to the R2 public URL.
//   https://s4-media1.study4.com/media/tez_media/img/x.png
//   -> <R2_PUBLIC_URL>/toeic/img/x.png   (sound/ handled the same way)
// Reversible: re-run after media is on R2; safe to run repeatedly.

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const SOURCE_PREFIX = 'https://s4-media1.study4.com/media/';
const apply = process.argv.includes('--apply');

const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
if (!publicUrl || publicUrl.includes('your-')) {
  throw new Error(
    'R2_PUBLIC_URL is empty or still a placeholder. Set the real public base URL first.',
  );
}
if (publicUrl.includes('r2.cloudflarestorage.com')) {
  throw new Error(
    'R2_PUBLIC_URL is the S3 API endpoint (*.r2.cloudflarestorage.com), which is NOT public. ' +
      'Use the r2.dev managed domain (https://pub-xxxx.r2.dev) or a custom domain instead.',
  );
}
const TARGET_PREFIX = `${publicUrl}/toeic/`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function countRemaining() {
  const [q, g] = await Promise.all([
    prisma.$queryRaw`SELECT count(*)::int AS n FROM questions WHERE image_url LIKE ${'%study4.com%'} OR audio_url LIKE ${'%study4.com%'}`,
    prisma.$queryRaw`SELECT count(*)::int AS n FROM question_groups WHERE image_url LIKE ${'%study4.com%'} OR audio_url LIKE ${'%study4.com%'}`,
  ]);
  return { questions: q[0].n, groups: g[0].n };
}

async function main() {
  console.log('Source prefix:', SOURCE_PREFIX);
  console.log('Target prefix:', TARGET_PREFIX);
  console.log(
    'Mode         :',
    apply ? 'APPLY' : 'DRY-RUN (use --apply to write)',
  );

  const before = await countRemaining();
  console.log(
    `\nRows still pointing at study4: questions=${before.questions}, question_groups=${before.groups}`,
  );

  if (!apply) {
    console.log('\nDry-run only. No changes made.');
    return;
  }

  const qImg =
    await prisma.$executeRaw`UPDATE questions SET image_url = replace(image_url, ${SOURCE_PREFIX}, ${TARGET_PREFIX}) WHERE image_url LIKE ${'%study4.com%'}`;
  const qAud =
    await prisma.$executeRaw`UPDATE questions SET audio_url = replace(audio_url, ${SOURCE_PREFIX}, ${TARGET_PREFIX}) WHERE audio_url LIKE ${'%study4.com%'}`;
  const gImg =
    await prisma.$executeRaw`UPDATE question_groups SET image_url = replace(image_url, ${SOURCE_PREFIX}, ${TARGET_PREFIX}) WHERE image_url LIKE ${'%study4.com%'}`;
  const gAud =
    await prisma.$executeRaw`UPDATE question_groups SET audio_url = replace(audio_url, ${SOURCE_PREFIX}, ${TARGET_PREFIX}) WHERE audio_url LIKE ${'%study4.com%'}`;

  console.log(
    `\nUpdated rows: questions.image=${qImg}, questions.audio=${qAud}, groups.image=${gImg}, groups.audio=${gAud}`,
  );

  const after = await countRemaining();
  console.log(
    `Remaining study4 rows: questions=${after.questions}, question_groups=${after.groups}`,
  );
  console.log(
    after.questions === 0 && after.groups === 0
      ? '\n✅ All media URLs now point at R2.'
      : '\n⚠️ Some rows still reference study4 — check for other hosts.',
  );
}

main()
  .catch((err) => {
    console.error('\n❌ Rewrite failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
