require('dotenv/config');
// Uploads local flashcard crawler images to Cloudflare R2.
// Usage: node prisma/scripts/upload-flashcard-images-to-r2.cjs

const fs = require('node:fs');
const path = require('node:path');
const {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const CONCURRENCY = 10;
const MAX_RETRIES = 3;
const CRAWLER_OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../flashcard-crawler/output',
);

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

function assertR2Config() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error('Missing R2_ACCOUNT_ID/R2_ACCESS_KEY/R2_SECRET_KEY/R2_BUCKET_NAME/R2_PUBLIC_URL.');
  }
  if ([accountId, accessKeyId, secretAccessKey, bucket, publicUrl].some((value) => value.includes('your-'))) {
    throw new Error('R2 config still contains .env.example placeholder values.');
  }
  if (publicUrl.includes('r2.cloudflarestorage.com')) {
    throw new Error('R2_PUBLIC_URL must be the public r2.dev/custom-domain origin, not the S3 API endpoint.');
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeImagePath(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/images/')) return null;
  return imageUrl.replace(/^\/+/, '').replace(/\\/g, '/');
}

function imagePathToKey(imagePath) {
  return `flashcards/${imagePath.replace(/^images\//, '')}`;
}

function keyToPublicUrl(key) {
  return `${publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function collectImageEntries() {
  const index = readJson(path.join(CRAWLER_OUTPUT_DIR, 'lists_index.json'));
  const entriesByKey = new Map();
  const missing = [];

  for (const list of index.lists) {
    const payload = readJson(
      path.join(CRAWLER_OUTPUT_DIR, list.slug, 'words.json'),
    );

    for (const word of payload.words ?? []) {
      const imagePath = normalizeImagePath(word.image_url);
      if (!imagePath) continue;

      const localPath = path.join(CRAWLER_OUTPUT_DIR, imagePath);
      if (!fs.existsSync(localPath)) {
        missing.push(imagePath);
        continue;
      }

      const key = imagePathToKey(imagePath);
      entriesByKey.set(key, {
        key,
        localPath,
        publicUrl: keyToPublicUrl(key),
      });
    }
  }

  return { entries: [...entriesByKey.values()], missing };
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
      if (done % 100 === 0 || done === items.length) {
        console.log(`  progress: ${done}/${items.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, runner));
  return results;
}

async function main() {
  assertR2Config();

  if (!fs.existsSync(CRAWLER_OUTPUT_DIR)) {
    throw new Error(`Crawler output directory not found: ${CRAWLER_OUTPUT_DIR}`);
  }

  const { entries, missing } = collectImageEntries();
  console.log(`Found ${entries.length} unique local flashcard images.`);
  if (missing.length) {
    console.log(`Missing local image files: ${missing.length}`);
  }
  console.log(`Uploading to R2 bucket "${bucket}" with concurrency ${CONCURRENCY}.`);

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const results = await runPool(entries, (entry) => uploadOne(s3, entry));
  const tally = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  const uploadedBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  const failed = results.filter((result) => result.status === 'failed');

  console.log('\n=== Summary ===');
  for (const [status, count] of Object.entries(tally)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`  uploaded bytes: ${(uploadedBytes / 1024 / 1024).toFixed(1)} MB`);

  if (failed.length) {
    console.log('\nFailed uploads:');
    failed.slice(0, 20).forEach((result) =>
      console.log(`  ${result.key} - ${result.error}`),
    );
    process.exitCode = 1;
    return;
  }

  console.log('\nAll flashcard images are present in R2.');
}

main().catch((err) => {
  console.error('\nFlashcard image upload failed:', err.message);
  process.exit(1);
});
