require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  console.log('--- DB Media Checker ---');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');

  const [questions, groups] = await Promise.all([
    prisma.question.findMany({ select: { imageUrl: true, audioUrl: true } }),
    prisma.questionGroup.findMany({ select: { imageUrl: true, audioUrl: true } }),
  ]);

  const allUrls = [];
  const imageSet = new Set();
  const audioSet = new Set();

  for (const row of [...questions, ...groups]) {
    if (row.imageUrl) {
      allUrls.push({ type: 'image', url: row.imageUrl });
      imageSet.add(row.imageUrl);
    }
    if (row.audioUrl) {
      allUrls.push({ type: 'audio', url: row.audioUrl });
      audioSet.add(row.audioUrl);
    }
  }

  console.log(`\nFound ${allUrls.length} total media URLs in DB (${imageSet.size} distinct images, ${audioSet.size} distinct audios)`);

  // Classify domains/prefixes
  const classification = {
    study4: 0,
    r2: 0,
    local_toeic: 0,
    other: 0,
  };

  const domainSamples = {};

  for (const u of [...imageSet, ...audioSet]) {
    let category = 'other';
    if (u.includes('study4.com')) {
      category = 'study4';
    } else if (u.includes('.r2.dev') || (process.env.R2_PUBLIC_URL && u.includes(process.env.R2_PUBLIC_URL))) {
      category = 'r2';
    } else if (u.includes('images/toeic') || u.includes('/images/toeic')) {
      category = 'local_toeic';
    }

    classification[category]++;
    if (!domainSamples[category]) {
      domainSamples[category] = [];
    }
    if (domainSamples[category].length < 3) {
      domainSamples[category].push(u);
    }
  }

  console.log('\nClassification of DISTINCT media URLs:');
  console.log('  Pointing to Study4.com (Not migrated):', classification.study4);
  if (classification.study4 > 0) {
    console.log('    Samples:', domainSamples.study4);
  }
  console.log('  Pointing to Cloudflare R2:', classification.r2);
  if (classification.r2 > 0) {
    console.log('    Samples:', domainSamples.r2);
  }
  console.log('  Pointing to Local "images/toeic" path:', classification.local_toeic);
  if (classification.local_toeic > 0) {
    console.log('    Samples:', domainSamples.local_toeic);
  }
  console.log('  Pointing to other domains:', classification.other);
  if (classification.other > 0) {
    console.log('    Samples:', domainSamples.other);
  }

  // Check how many files in public/images/toeic are actually used in the database
  const localToeicDir = path.join(__dirname, '../../..', 'front-end/public/images/toeic');
  if (fs.existsSync(localToeicDir)) {
    const localFiles = fs.readdirSync(localToeicDir).filter(f => fs.statSync(path.join(localToeicDir, f)).isFile());
    console.log(`\nLocal directory front-end/public/images/toeic exists with ${localFiles.length} files.`);

    let matchedFiles = 0;
    const unmatchedSamples = [];

    for (const file of localFiles) {
      // Check if this filename is contained in any DB URL
      const isUsed = [...imageSet, ...audioSet].some(u => u.includes(file));
      if (isUsed) {
        matchedFiles++;
      } else {
        if (unmatchedSamples.length < 5) {
          unmatchedSamples.push(file);
        }
      }
    }

    console.log(`  Number of local files referenced/used in DB: ${matchedFiles} / ${localFiles.length}`);
    console.log(`  Number of local files NOT referenced in DB (dead weight): ${localFiles.length - matchedFiles}`);
    if (unmatchedSamples.length > 0) {
      console.log('    Some unmatched file samples:', unmatchedSamples);
    }
  } else {
    console.log(`\nLocal directory front-end/public/images/toeic not found at ${localToeicDir}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error('Error running checker:', err);
});
