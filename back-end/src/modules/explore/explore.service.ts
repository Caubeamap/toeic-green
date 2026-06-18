import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { WordRatingValue } from './dto/rate-word.dto';

const COLLECTION_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  level: true,
  author: true,
  tags: true,
  wordCount: true,
  estimatedMinutes: true,
  coverImageUrl: true,
  sourceUrl: true,
} satisfies Prisma.ExploreCollectionSelect;

const WORD_SELECT = {
  id: true,
  word: true,
  phonetic: true,
  partOfSpeech: true,
  meaning: true,
  example: true,
  exampleTranslation: true,
  imageUrl: true,
  audioUrl: true,
  examples: {
    orderBy: { sortOrder: 'asc' },
    select: {
      text: true,
      translation: true,
    },
  },
} satisfies Prisma.ExploreWordSelect;

type CollectionSummary = Prisma.ExploreCollectionGetPayload<{
  select: typeof COLLECTION_SELECT;
}>;
type WordSource = Prisma.ExploreWordGetPayload<{ select: typeof WORD_SELECT }>;
type CollectionWithWords = CollectionSummary & { words: WordSource[] };

const COLLECTION_CACHE_TTL_MS = 60_000;
const WORD_CACHE_TTL_MS = 5 * 60_000;

@Injectable()
export class ExploreService implements OnModuleInit {
  private collectionsCache: {
    expiresAt: number;
    value: ReturnType<ExploreService['toCollectionSummary']>[];
  } | null = null;

  private collectionDetailCache = new Map<
    string,
    {
      expiresAt: number;
      value: ReturnType<ExploreService['toCollectionDetail']>;
    }
  >();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.listCollections().catch(() => {});
  }

  async listCollections() {
    const now = Date.now();
    if (this.collectionsCache && this.collectionsCache.expiresAt > now) {
      return this.collectionsCache.value;
    }

    const collections = await this.prisma.exploreCollection.findMany({
      where: { isPublished: true },
      select: COLLECTION_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const value = collections.map((collection) =>
      this.toCollectionSummary(collection),
    );

    this.collectionsCache = {
      expiresAt: Date.now() + COLLECTION_CACHE_TTL_MS,
      value,
    };

    return value;
  }

  async getCollection(slug: string) {
    const now = Date.now();
    const cached = this.collectionDetailCache.get(slug);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const collection = await this.prisma.exploreCollection.findUnique({
      where: { slug },
      select: {
        ...COLLECTION_SELECT,
        isPublished: true,
        words: {
          select: WORD_SELECT,
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!collection || !collection.isPublished) {
      throw new NotFoundException('Không tìm thấy bộ từ vựng.');
    }

    const value = this.toCollectionDetail(collection);
    this.collectionDetailCache.set(slug, {
      expiresAt: Date.now() + WORD_CACHE_TTL_MS,
      value,
    });

    return value;
  }

  private toCollectionSummary(collection: CollectionSummary) {
    return {
      id: collection.slug,
      slug: collection.slug,
      title: collection.title,
      description: collection.description ?? '',
      category: collection.category ?? 'Vocabulary',
      level: collection.level ?? 'Tổng hợp',
      author: collection.author ?? 'TOEIC Green',
      wordCount: collection.wordCount,
      estimatedMinutes: collection.estimatedMinutes,
      tags: collection.tags,
      coverImageUrl: collection.coverImageUrl ?? undefined,
      sourceUrl: collection.sourceUrl ?? undefined,
    };
  }

  private toCollectionDetail(collection: CollectionWithWords) {
    return {
      ...this.toCollectionSummary(collection),
      words: collection.words.map((word) => this.toWord(word)),
    };
  }

  private toWord(word: WordSource) {
    const firstExample = word.examples[0];

    return {
      id: word.id.toString(),
      word: word.word,
      phonetic: word.phonetic ?? '',
      partOfSpeech: this.toFrontendPartOfSpeech(word.partOfSpeech),
      meaning: word.meaning,
      example: word.example ?? firstExample?.text ?? '',
      exampleTranslation:
        word.exampleTranslation ?? firstExample?.translation ?? '',
      imageUrl: word.imageUrl ?? undefined,
      audioUrl: word.audioUrl ?? undefined,
      examples: word.examples.map((example) => ({
        text: example.text,
        translation: example.translation ?? '',
      })),
    };
  }

  private toFrontendPartOfSpeech(value: string | null) {
    if (
      value === 'noun' ||
      value === 'verb' ||
      value === 'adjective' ||
      value === 'adverb'
    ) {
      return value;
    }

    return 'phrase';
  }

  /* ──────────────── User progress (per logged-in user) ──────────────── */

  private async resolveCollectionId(slug: string) {
    const collection = await this.prisma.exploreCollection.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!collection) {
      throw new NotFoundException('Không tìm thấy bộ từ vựng.');
    }

    return collection.id;
  }

  private parseWordId(wordId: string): bigint {
    try {
      return BigInt(wordId);
    } catch {
      throw new BadRequestException('Mã từ vựng không hợp lệ.');
    }
  }

  async getCollectionProgress(userId: string, slug: string) {
    const collectionId = await this.resolveCollectionId(slug);

    const [progress, ratings] = await Promise.all([
      this.prisma.exploreProgress.findUnique({
        where: { userId_collectionId: { userId, collectionId } },
        select: { isSaved: true, isStudying: true, lastStudiedAt: true },
      }),
      this.prisma.wordRating.findMany({
        where: { userId, exploreWord: { collectionId } },
        select: { exploreWordId: true, rating: true },
      }),
    ]);

    const ratingsByWordId: Record<string, string> = {};
    for (const entry of ratings) {
      ratingsByWordId[entry.exploreWordId.toString()] = entry.rating;
    }

    return {
      isSaved: progress?.isSaved ?? false,
      isStudying: progress?.isStudying ?? false,
      lastStudiedAt: progress?.lastStudiedAt ?? null,
      ratings: ratingsByWordId,
    };
  }

  async rateWord(userId: string, wordId: string, rating: WordRatingValue) {
    const exploreWordId = this.parseWordId(wordId);

    const word = await this.prisma.exploreWord.findUnique({
      where: { id: exploreWordId },
      select: { collectionId: true },
    });

    if (!word) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.wordRating.upsert({
        where: { userId_exploreWordId: { userId, exploreWordId } },
        create: { userId, exploreWordId, rating },
        update: { rating },
      }),
      this.prisma.exploreProgress.upsert({
        where: {
          userId_collectionId: { userId, collectionId: word.collectionId },
        },
        create: {
          userId,
          collectionId: word.collectionId,
          isStudying: true,
          lastStudiedAt: now,
        },
        update: { isStudying: true, lastStudiedAt: now },
      }),
    ]);

    return { ok: true, wordId, rating };
  }

  async resetKnownRatings(userId: string, slug: string) {
    const collectionId = await this.resolveCollectionId(slug);

    const result = await this.prisma.wordRating.deleteMany({
      where: { userId, rating: 'known', exploreWord: { collectionId } },
    });

    return { reset: result.count };
  }

  async setSaved(userId: string, slug: string, isSaved: boolean) {
    const collectionId = await this.resolveCollectionId(slug);

    await this.prisma.exploreProgress.upsert({
      where: { userId_collectionId: { userId, collectionId } },
      create: { userId, collectionId, isSaved },
      update: { isSaved },
    });

    return { isSaved };
  }
}
