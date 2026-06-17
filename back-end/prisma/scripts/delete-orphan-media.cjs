require('dotenv/config');
// back-end/prisma/scripts/delete-orphan-media.cjs
// Usage:
//   node prisma/scripts/delete-orphan-media.cjs           (dry-run: lists what would be deleted)
//   node prisma/scripts/delete-orphan-media.cjs --apply   (deletes)
//
// Removes orphan objects from the first migration run that used the old flat
// key scheme (toeic/img/*, toeic/sound/*). The current scheme stores media
// under toeic/tez_media/..., toeic/economy1000/..., toeic/gg_imgs/... so these
// flat prefixes are safe to delete.

const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');

const ORPHAN_PREFIXES = ['toeic/img/', 'toeic/sound/'];
const apply = process.argv.includes('--apply');

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

async function listAll(prefix) {
  const keys = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of out.Contents || []) keys.push(obj.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main() {
  let total = 0;
  for (const prefix of ORPHAN_PREFIXES) {
    const keys = await listAll(prefix);
    console.log(`${prefix}: ${keys.length} objects`);
    total += keys.length;
    if (apply && keys.length) {
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000);
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })) },
          }),
        );
      }
      console.log(`  deleted ${keys.length}`);
    }
  }
  console.log(
    `\nTotal: ${total} orphan objects ${apply ? 'deleted' : '(dry-run; use --apply to delete)'}`,
  );
}

main().catch((err) => {
  console.error('❌ Cleanup failed:', err.message);
  process.exit(1);
});
