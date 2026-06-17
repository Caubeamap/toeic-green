require('dotenv/config');
// Imports flashcard crawler data into Supabase.
// Usage: node prisma/scripts/seed-flashcard-vocabulary.cjs

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const SOURCE = 'study4';
const WORD_BATCH_SIZE = 400;
const EXAMPLE_BATCH_SIZE = 1000;
const CRAWLER_OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../flashcard-crawler/output',
);
const r2PublicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

if (!r2PublicUrl || r2PublicUrl.includes('your-')) {
  throw new Error('R2_PUBLIC_URL is required so imported image_url values point at R2.');
}

if (r2PublicUrl.includes('r2.cloudflarestorage.com')) {
  throw new Error('R2_PUBLIC_URL must be the public r2.dev/custom-domain origin, not the S3 API endpoint.');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function titleIncludes(list, keyword) {
  return list.title.toLowerCase().includes(keyword);
}

function getCategory(list) {
  const title = list.title.toLowerCase();

  if (title.includes('toeic')) return 'TOEIC';
  if (title.includes('ielts')) return 'IELTS';
  if (title.includes('toefl')) return 'TOEFL';
  if (title.includes('sat')) return 'SAT';
  if (title.includes('gre') || title.includes('gmat')) return 'GRE/GMAT';
  if (title.includes('academic')) return 'Academic';
  if (title.includes('business')) return 'Business';
  if (title.includes('idiom')) return 'Idioms';
  if (title.includes('giao tiếp')) return 'Communication';
  if (title.includes('văn phòng')) return 'Office';

  return 'Vocabulary';
}

function getLevel(list) {
  const title = list.title.toLowerCase();

  if (
    title.includes('cơ bản') ||
    title.includes('văn phòng') ||
    title.includes('600 toeic')
  ) {
    return 'Cơ bản';
  }
  if (title.includes('trung cấp') || title.includes('business')) {
    return 'Trung cấp';
  }
  if (
    title.includes('academic') ||
    title.includes('gre') ||
    title.includes('gmat') ||
    title.includes('sat') ||
    title.includes('toefl') ||
    title.includes('ielts')
  ) {
    return 'Nâng cao';
  }

  return 'Tổng hợp';
}

function getTags(list, category) {
  const tags = new Set([category]);

  if (titleIncludes(list, 'toeic')) tags.add('TOEIC');
  if (titleIncludes(list, 'ielts')) tags.add('IELTS');
  if (titleIncludes(list, 'toefl')) tags.add('TOEFL');
  if (titleIncludes(list, 'sat')) tags.add('SAT');
  if (titleIncludes(list, 'business')) tags.add('Business');
  if (titleIncludes(list, 'academic')) tags.add('Academic');
  if (titleIncludes(list, 'listening')) tags.add('Listening');
  if (titleIncludes(list, 'idiom')) tags.add('Idioms');
  if (titleIncludes(list, 'văn phòng')) tags.add('Office');
  if (titleIncludes(list, 'giao tiếp')) tags.add('Communication');

  return [...tags];
}

function getDescription(list, category) {
  return `Bộ ${list.word_count.toLocaleString('vi-VN')} từ vựng ${category} được đồng bộ từ dữ liệu crawl, dùng để xem danh sách và luyện flashcard.`;
}

function getEstimatedMinutes(wordCount) {
  return Math.max(10, Math.ceil(wordCount / 60) * 5);
}

function normalizePartOfSpeech(raw) {
  const value = String(raw ?? '').trim().toLowerCase();

  if (value === 'noun' || value === 'shipment') return 'noun';
  if (value === 'verb') return 'verb';
  if (value === 'adjective' || value === 'adj') return 'adjective';
  if (value === 'adverb' || value === 'adv') return 'adverb';

  return 'phrase';
}

function normalizeWord(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeDefinition(raw) {
  return String(raw ?? '')
    .replace(/^[,\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitExample(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return { text: '', translation: null };

  const match = value.match(/^(.*?)\s*\(([^()]*[\u00c0-\u1ef9][^()]*)\)\s*$/u);
  if (!match) return { text: value, translation: null };

  return {
    text: match[1].trim(),
    translation: match[2].trim(),
  };
}

function normalizeImagePath(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/images/')) return null;
  return imageUrl.replace(/^\/+/, '').replace(/\\/g, '/');
}

function imagePathToKey(imagePath) {
  return `flashcards/${imagePath.replace(/^images\//, '')}`;
}

function keyToPublicUrl(key) {
  return `${r2PublicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function getImageFields(word) {
  const sourceImagePath = normalizeImagePath(word.image_url);
  if (!sourceImagePath) {
    return { sourceImagePath: null, imageKey: null, imageUrl: null };
  }

  const localPath = path.join(CRAWLER_OUTPUT_DIR, sourceImagePath);
  if (!fs.existsSync(localPath)) {
    return { sourceImagePath, imageKey: null, imageUrl: null };
  }

  const imageKey = imagePathToKey(sourceImagePath);
  return {
    sourceImagePath,
    imageKey,
    imageUrl: keyToPublicUrl(imageKey),
  };
}

function normalizeAudioUrl(raw, word) {
  const value = String(raw ?? '').trim();
  if (value) return value;

  return `tts://en-US/${encodeURIComponent(word)}`;
}

function normalizeCrawledAt(raw) {
  const value = raw ? new Date(raw) : null;
  return value && !Number.isNaN(value.getTime()) ? value : null;
}

function toWordRows(slug, rawWords) {
  return rawWords
    .map((word, index) => {
      const wordText = String(word.word ?? '').trim();
      const sourceIndex = Number.isInteger(word.index) ? word.index : index + 1;
      const sourceExamples = Array.isArray(word.examples) ? word.examples : [];
      const primaryExample = splitExample(sourceExamples.find(Boolean));
      const image = getImageFields(word);

      return {
        sourceIndex,
        sortOrder: sourceIndex,
        sublist: String(word.sublist ?? '').trim() || null,
        word: wordText,
        normalizedWord: normalizeWord(wordText),
        phonetic: String(word.phonetic ?? '').trim() || null,
        partOfSpeech: normalizePartOfSpeech(word.part_of_speech),
        meaning: normalizeDefinition(word.definition_vi),
        example: primaryExample.text || null,
        exampleTranslation: primaryExample.translation,
        sourceImagePath: image.sourceImagePath,
        imageKey: image.imageKey,
        imageUrl: image.imageUrl,
        audioUrl: normalizeAudioUrl(word.audio_url, wordText),
        examples: sourceExamples
          .map(splitExample)
          .filter((example) => example.text)
          .map((example, exampleIndex) => ({
            ...example,
            sortOrder: exampleIndex,
          })),
        slug,
      };
    })
    .filter((word) => word.word && word.meaning);
}

async function upsertCollection(client, list, info, sortOrder) {
  const category = getCategory(list);
  const wordCount = info.total_words_crawled || list.word_count;
  const sourceListId = String(info.list_id || list.list_id || '');
  const coverWord = readJson(
    path.join(CRAWLER_OUTPUT_DIR, list.slug, 'words.json'),
  ).words?.find((word) => getImageFields(word).imageUrl);
  const coverImage = coverWord ? getImageFields(coverWord) : {};

  const result = await client.query(
    `
      INSERT INTO explore_collections (
        source, source_list_id, slug, title, description, category, level,
        author, source_url, tags, word_count, expected_word_count,
        estimated_minutes, total_pages, cover_image_url, cover_image_key,
        is_published, sort_order, crawled_at, imported_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10::text[], $11, $12,
        $13, $14, $15, $16,
        true, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (slug) DO UPDATE SET
        source = EXCLUDED.source,
        source_list_id = EXCLUDED.source_list_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        level = EXCLUDED.level,
        author = EXCLUDED.author,
        source_url = EXCLUDED.source_url,
        tags = EXCLUDED.tags,
        word_count = EXCLUDED.word_count,
        expected_word_count = EXCLUDED.expected_word_count,
        estimated_minutes = EXCLUDED.estimated_minutes,
        total_pages = EXCLUDED.total_pages,
        cover_image_url = EXCLUDED.cover_image_url,
        cover_image_key = EXCLUDED.cover_image_key,
        is_published = EXCLUDED.is_published,
        sort_order = EXCLUDED.sort_order,
        crawled_at = EXCLUDED.crawled_at,
        imported_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [
      SOURCE,
      sourceListId || null,
      list.slug,
      info.list_title || list.title,
      getDescription(list, category),
      category,
      getLevel(list),
      info.author || list.author || SOURCE,
      info.source_url || list.url || null,
      getTags(list, category),
      wordCount,
      info.total_words_expected || list.word_count || null,
      getEstimatedMinutes(wordCount),
      info.total_pages || null,
      coverImage.imageUrl || null,
      coverImage.imageKey || null,
      sortOrder,
      normalizeCrawledAt(info.crawled_at),
    ],
  );

  return result.rows[0].id;
}

async function upsertWordBatch(client, collectionId, words) {
  if (words.length === 0) return new Map();

  const columnsPerRow = 15;
  const values = [];
  const placeholders = words.map((word, rowIndex) => {
    const base = rowIndex * columnsPerRow;
    values.push(
      collectionId,
      word.sourceIndex,
      word.sortOrder,
      word.sublist,
      word.word,
      word.normalizedWord,
      word.phonetic,
      word.partOfSpeech,
      word.meaning,
      word.example,
      word.exampleTranslation,
      word.sourceImagePath,
      word.imageKey,
      word.imageUrl,
      word.audioUrl,
    );

    return `(${Array.from({ length: columnsPerRow }, (_, index) => `$${base + index + 1}`).join(', ')}, CURRENT_TIMESTAMP)`;
  });

  const result = await client.query(
    `
      INSERT INTO explore_words (
        collection_id, source_index, sort_order, sublist, word,
        normalized_word, phonetic, part_of_speech, meaning, example,
        example_translation, source_image_path, image_key, image_url,
        audio_url, updated_at
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (collection_id, source_index) DO UPDATE SET
        sort_order = EXCLUDED.sort_order,
        sublist = EXCLUDED.sublist,
        word = EXCLUDED.word,
        normalized_word = EXCLUDED.normalized_word,
        phonetic = EXCLUDED.phonetic,
        part_of_speech = EXCLUDED.part_of_speech,
        meaning = EXCLUDED.meaning,
        example = EXCLUDED.example,
        example_translation = EXCLUDED.example_translation,
        source_image_path = EXCLUDED.source_image_path,
        image_key = EXCLUDED.image_key,
        image_url = EXCLUDED.image_url,
        audio_url = EXCLUDED.audio_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, source_index
    `,
    values,
  );

  return new Map(
    result.rows.map((row) => [Number(row.source_index), BigInt(row.id)]),
  );
}

async function insertExampleBatch(client, examples) {
  if (examples.length === 0) return;

  const columnsPerRow = 4;
  const values = [];
  const placeholders = examples.map((example, rowIndex) => {
    const base = rowIndex * columnsPerRow;
    values.push(
      example.exploreWordId.toString(),
      example.text,
      example.translation,
      example.sortOrder,
    );
    return `($${base + 1}::bigint, $${base + 2}, $${base + 3}, $${base + 4})`;
  });

  await client.query(
    `
      INSERT INTO explore_word_examples (
        explore_word_id, text, translation, sort_order
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (explore_word_id, sort_order) DO UPDATE SET
        text = EXCLUDED.text,
        translation = EXCLUDED.translation
    `,
    values,
  );
}

async function seedCollection(client, list, sortOrder) {
  const listDir = path.join(CRAWLER_OUTPUT_DIR, list.slug);
  const info = readJson(path.join(listDir, 'list_info.json'));
  const payload = readJson(path.join(listDir, 'words.json'));
  const words = toWordRows(list.slug, payload.words ?? []);
  const collectionId = await upsertCollection(client, list, info, sortOrder);
  const sourceIndexes = words.map((word) => word.sourceIndex);
  const wordIdsByIndex = new Map();

  for (let index = 0; index < words.length; index += WORD_BATCH_SIZE) {
    const wordBatchIds = await upsertWordBatch(
      client,
      collectionId,
      words.slice(index, index + WORD_BATCH_SIZE),
    );
    for (const [sourceIndex, id] of wordBatchIds) {
      wordIdsByIndex.set(sourceIndex, id);
    }
  }

  await client.query(
    `
      DELETE FROM explore_words
      WHERE collection_id = $1
        AND (source_index IS NULL OR NOT (source_index = ANY($2::int[])))
    `,
    [collectionId, sourceIndexes],
  );

  await client.query(
    `
      DELETE FROM explore_word_examples
      WHERE explore_word_id IN (
        SELECT id FROM explore_words WHERE collection_id = $1
      )
    `,
    [collectionId],
  );

  const examples = [];
  for (const word of words) {
    const exploreWordId = wordIdsByIndex.get(word.sourceIndex);
    if (!exploreWordId) continue;

    for (const example of word.examples) {
      examples.push({ exploreWordId, ...example });
    }
  }

  for (let index = 0; index < examples.length; index += EXAMPLE_BATCH_SIZE) {
    await insertExampleBatch(
      client,
      examples.slice(index, index + EXAMPLE_BATCH_SIZE),
    );
  }

  return {
    slug: list.slug,
    words: words.length,
    examples: examples.length,
  };
}

async function main() {
  if (!fs.existsSync(CRAWLER_OUTPUT_DIR)) {
    throw new Error(`Crawler output directory not found: ${CRAWLER_OUTPUT_DIR}`);
  }

  const index = readJson(path.join(CRAWLER_OUTPUT_DIR, 'lists_index.json'));
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.error('[pg pool] idle client error:', err.message);
  });

  const client = await pool.connect();
  const results = [];

  try {
    for (const [sortOrder, list] of index.lists.entries()) {
      console.log(`Importing ${list.slug}...`);
      await client.query('BEGIN');
      try {
        const result = await seedCollection(client, list, sortOrder);
        await client.query('COMMIT');
        results.push(result);
        console.log(`  ${result.words} words, ${result.examples} examples`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  const wordCount = results.reduce((sum, result) => sum + result.words, 0);
  const exampleCount = results.reduce((sum, result) => sum + result.examples, 0);
  console.log(
    `\nImported ${results.length} flashcard collections, ${wordCount} words, ${exampleCount} examples.`,
  );
}

main().catch((err) => {
  console.error('\nFlashcard vocabulary import failed:', err.message);
  process.exit(1);
});
