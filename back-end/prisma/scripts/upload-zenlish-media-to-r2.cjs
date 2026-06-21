require('dotenv/config');
// Upload local zenlish media (audio + images) to Cloudflare R2.
// Usage: node prisma/scripts/upload-zenlish-media-to-r2.cjs

const fs = require('node:fs');
const path = require('node:path');
const {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const CONCURRENCY = 10;
const MAX_RETRIES = 3;
const ZENLISH_DIR = path.resolve(
  __dirname,
  '../../../toeic-crawler/output/zenlish',
);

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

function assertR2Config() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      'Missing R2_ACCOUNT_ID/R2_ACCESS_KEY/R2_SECRET_KEY/R2_BUCKET_NAME/R2_PUBLIC_URL.',
    );
  }
  if (
    [accountId, accessKeyId, secretAccessKey, bucket, publicUrl].some((v) =>
      v.includes('your-'),
    )
  ) {
    throw new Error(
      'R2 config still contains .env.example placeholder values.',
    );
  }
  if (publicUrl.includes('r2.cloudflarestorage.com')) {
    throw new Error(
      'R2_PUBLIC_URL must be the public r2.dev/custom-domain origin, not the S3 API endpoint.',
    );
  }
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

function collectMediaEntries() {
  const index = JSON.parse(
    fs.readFileSync(path.join(ZENLISH_DIR, 'tests_index.json'), 'utf8'),
  );
  const entries = [];

  for (const test of index.tests) {
    const testDir = path.join(ZENLISH_DIR, test.slug);
    if (!fs.existsSync(testDir)) {
      console.warn(`  WARN: test directory not found: ${test.slug}`);
      continue;
    }

    for (const subdir of ['audio', 'images']) {
      const mediaDir = path.join(testDir, subdir);
      if (!fs.existsSync(mediaDir)) continue;

      for (const file of fs.readdirSync(mediaDir)) {
        const localPath = path.join(mediaDir, file);
        if (!fs.statSync(localPath).isFile()) continue;

        const key = `toeic/zenlish/${test.slug}/${subdir}/${file}`;
        entries.push({ key, localPath });
      }
    }
  }

  return entries;
}

async function existsInR2(s3, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

async function uploadOne(s3, entry) {
  if (await existsInR2(s3, entry.key)) {
    return { ...entry, status: 'exists', bytes: 0 };
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const body = fs.readFileSync(entry.localPath);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: entry.key,
          Body: body,
          ContentType: contentTypeFor(entry.localPath),
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return { ...entry, status: 'uploaded', bytes: body.length };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    ...entry,
    status: 'failed',
    error: lastError?.message ?? 'unknown error',
    bytes: 0,
  };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;

  async function runner() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
      done += 1;
      if (done % 50 === 0 || done === items.length) {
        console.log(`  progress: ${done}/${items.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, runner));
  return results;
}

async function main() {
  assertR2Config();

  if (!fs.existsSync(ZENLISH_DIR)) {
    throw new Error(`Zenlish output directory not found: ${ZENLISH_DIR}`);
  }

  const entries = collectMediaEntries();

  const audioCount = entries.filter((e) => e.key.includes('/audio/')).length;
  const imageCount = entries.filter((e) => e.key.includes('/images/')).length;
  console.log(
    `Found ${entries.length} zenlish media files (${audioCount} audio, ${imageCount} images).`,
  );
  console.log(
    `Uploading to R2 bucket "${bucket}" with concurrency ${CONCURRENCY}.\n`,
  );

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const results = await runPool(entries, (entry) => uploadOne(s3, entry));
  const tally = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const uploadedBytes = results.reduce((sum, r) => sum + r.bytes, 0);
  const failed = results.filter((r) => r.status === 'failed');

  console.log('\n=== Summary ===');
  for (const [status, count] of Object.entries(tally)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(
    `  uploaded bytes: ${(uploadedBytes / 1024 / 1024).toFixed(1)} MB`,
  );

  if (failed.length) {
    console.log('\nFailed uploads:');
    failed.slice(0, 20).forEach((r) => console.log(`  ${r.key} - ${r.error}`));
    process.exitCode = 1;
    return;
  }

  console.log('\nAll zenlish media files are present in R2.');
}

main().catch((err) => {
  console.error('\nZenlish media upload failed:', err.message);
  process.exit(1);
});
