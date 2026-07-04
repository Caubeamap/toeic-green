require('dotenv/config');
// back-end/prisma/scripts/check-r2.cjs
// Usage: node prisma/scripts/check-r2.cjs  (run from back-end/)
// Verifies Cloudflare R2 connectivity, bucket access, and write/read/delete.

const {
  S3Client,
  HeadBucketCommand,
  ListBucketsCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET_NAME;

function mask(value) {
  if (!value) return '(empty)';
  return `${value.slice(0, 4)}…${value.slice(-3)} (len ${value.length})`;
}

async function main() {
  console.log('R2 config:');
  console.log('  R2_ACCOUNT_ID :', mask(accountId));
  console.log('  R2_ACCESS_KEY :', mask(accessKeyId));
  console.log('  R2_SECRET_KEY :', mask(secretAccessKey));
  console.log('  R2_BUCKET_NAME:', bucket || '(empty)');
  console.log('  R2_PUBLIC_URL :', process.env.R2_PUBLIC_URL || '(empty)');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing one or more R2_* environment variables.');
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  console.log('  endpoint      :', endpoint);

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log('\n[1] ListBuckets…');
  try {
    const out = await s3.send(new ListBucketsCommand({}));
    console.log(
      '    buckets:',
      (out.Buckets || []).map((b) => b.Name).join(', ') || '(none)',
    );
  } catch (err) {
    console.log(
      '    ListBuckets failed (may be token-scoped):',
      err.name,
      err.message,
    );
  }

  console.log(`\n[2] HeadBucket "${bucket}"…`);
  await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log('    OK — bucket exists and is accessible.');

  const testKey = '_connectivity-check/hello.txt';
  console.log(`\n[3] PutObject "${testKey}"…`);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: 'toeic-green r2 connectivity ok',
      ContentType: 'text/plain',
    }),
  );
  console.log('    OK — write succeeded.');

  console.log('[4] GetObject…');
  const got = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: testKey }),
  );
  const body = await got.Body.transformToString();
  console.log('    read back:', JSON.stringify(body));

  console.log('[5] DeleteObject (cleanup)…');
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
  console.log('    OK — cleaned up.');

  console.log('\n✅ R2 connectivity verified: read + write + delete all work.');
}

main().catch((err) => {
  console.error('\n❌ R2 check failed:', err.name, '-', err.message);
  process.exit(1);
});
