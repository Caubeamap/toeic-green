require('dotenv/config');
// back-end/prisma/scripts/migrate-media-to-r2.cjs
// Usage: node prisma/scripts/migrate-media-to-r2.cjs   (run from back-end/)
//
// Downloads every distinct study4.com image/audio URL referenced by the DB
// (Question + QuestionGroup) and uploads it to the configured R2 bucket.
// Idempotent + resumable: existing R2 objects are skipped (HeadObject).
// Does NOT modify the database — run rewrite-media-urls.cjs afterwards.

const {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const SOURCE_HOST = 's4-media1.study4.com';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error('Missing R2_* environment variables.');
}
if (accountId.startsWith('your-')) {
  throw new Error(
    'R2_* values are still the .env.example placeholders. Set real credentials first.',
  );
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Map a study4 media URL to an R2 object key by preserving the full path after
// "/media/". Handles every study4 layout (tez_media/img, tez_media/sound,
// economy1000/testN_audios, gg_imgs/test, ...).
//   .../media/tez_media/img/x.png        -> toeic/tez_media/img/x.png
//   .../media/economy1000/test6_audios/y -> toeic/economy1000/test6_audios/y
const MEDIA_MARKER = '/media/';
function urlToKey(rawUrl) {
  const u = new URL(rawUrl);
  const idx = u.pathname.indexOf(MEDIA_MARKER);
  if (idx === -1) return null;
  const rest = u.pathname.slice(idx + MEDIA_MARKER.length);
  return rest ? `toeic/${rest}` : null;
}

function contentTypeFor(key, headerType) {
  if (headerType && headerType !== 'application/octet-stream')
    return headerType;
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  if (key.endsWith('.mp3')) return 'audio/mpeg';
  return 'application/octet-stream';
}

async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404)
      return false;
    throw err;
  }
}

async function migrateOne(rawUrl) {
  const key = urlToKey(rawUrl);
  if (!key) return { rawUrl, status: 'skipped-unrecognized' };

  if (await existsInR2(key)) return { rawUrl, key, status: 'exists' };

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = Buffer.from(await res.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentTypeFor(key, res.headers.get('content-type')),
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return { rawUrl, key, status: 'uploaded', bytes: body.length };
    } catch (err) {
      lastErr = err;
    }
  }
  return { rawUrl, key, status: 'failed', error: lastErr?.message };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function runner() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i]);
      done += 1;
      if (done % 25 === 0 || done === items.length) {
        console.log(`  progress: ${done}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, runner));
  return results;
}

async function collectUrls() {
  const [q, g] = await Promise.all([
    prisma.question.findMany({ select: { imageUrl: true, audioUrl: true } }),
    prisma.questionGroup.findMany({
      select: { imageUrl: true, audioUrl: true },
    }),
  ]);
  const set = new Set();
  for (const row of [...q, ...g]) {
    for (const v of [row.imageUrl, row.audioUrl]) {
      if (typeof v === 'string' && v.includes(SOURCE_HOST)) set.add(v);
    }
  }
  return [...set];
}

async function main() {
  console.log('Collecting distinct study4 media URLs from DB…');
  const urls = await collectUrls();
  const images = urls.filter((u) => u.includes('/img/')).length;
  const audio = urls.filter((u) => u.includes('/sound/')).length;
  console.log(
    `Found ${urls.length} distinct URLs (${images} images, ${audio} audio).`,
  );
  console.log(
    `Uploading to R2 bucket "${bucket}" with concurrency ${CONCURRENCY}…\n`,
  );

  const results = await runPool(urls, migrateOne);

  const tally = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const totalBytes = results.reduce((acc, r) => acc + (r.bytes || 0), 0);

  console.log('\n=== Summary ===');
  for (const [status, count] of Object.entries(tally)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`  uploaded bytes: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);

  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length) {
    console.log('\nFailed URLs (re-run to retry):');
    failed
      .slice(0, 20)
      .forEach((r) => console.log(`  ${r.rawUrl} — ${r.error}`));
    process.exitCode = 1;
  } else {
    console.log(
      '\n✅ All media present in R2. Next: confirm R2 public URL, then run rewrite-media-urls.cjs',
    );
  }
}

main()
  .catch((err) => {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
