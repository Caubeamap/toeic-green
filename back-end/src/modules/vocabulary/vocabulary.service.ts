import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';

type VocabularyRow = Prisma.UserVocabularyGetPayload<object>;

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  // Sổ tay từ vựng cá nhân: 2000 từ là dư cho người dùng thật, nhưng đặt trần để
  // một tài khoản bất thường không kéo về payload khổng lồ (bảo vệ bộ nhớ/băng
  // thông server khi có nhiều người dùng đồng thời).
  private static readonly MAX_VOCABULARY_ROWS = 2000;

  async list(userId: string) {
    const rows = await this.prisma.userVocabulary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: VocabularyService.MAX_VOCABULARY_ROWS,
    });

    return rows.map((row) => this.toResponse(row));
  }

  async create(userId: string, dto: CreateVocabularyDto) {
    try {
      const row = await this.prisma.userVocabulary.create({
        data: {
          userId,
          word: dto.word,
          meaning: dto.meaning,
          phonetic: dto.phonetic ?? null,
          partOfSpeech: dto.partOfSpeech ?? null,
          example: dto.example ?? null,
          exampleTranslation: dto.exampleTranslation ?? null,
          audioUrl: dto.audioUrl ?? null,
          status: this.toDbStatus(dto.status),
          isFavorite: dto.isFavorite ?? false,
        },
      });

      return this.toResponse(row);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async update(userId: string, id: string, dto: UpdateVocabularyDto) {
    const vocabularyId = this.parseId(id);
    await this.ensureOwned(userId, vocabularyId);

    const data: Prisma.UserVocabularyUpdateInput = {};
    if (dto.word !== undefined) data.word = dto.word;
    if (dto.meaning !== undefined) data.meaning = dto.meaning;
    if (dto.phonetic !== undefined) data.phonetic = dto.phonetic;
    if (dto.partOfSpeech !== undefined) data.partOfSpeech = dto.partOfSpeech;
    if (dto.example !== undefined) data.example = dto.example;
    if (dto.exampleTranslation !== undefined) {
      data.exampleTranslation = dto.exampleTranslation;
    }
    if (dto.audioUrl !== undefined) data.audioUrl = dto.audioUrl;
    if (dto.isFavorite !== undefined) data.isFavorite = dto.isFavorite;
    if (dto.status !== undefined) {
      data.status = this.toDbStatus(dto.status);
      // Đổi trạng thái cũng cập nhật mốc ôn tập gần nhất.
      data.lastReviewedAt = new Date();
    }

    try {
      const row = await this.prisma.userVocabulary.update({
        where: { id: vocabularyId },
        data,
      });

      return this.toResponse(row);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async remove(userId: string, id: string) {
    const vocabularyId = this.parseId(id);
    await this.ensureOwned(userId, vocabularyId);

    await this.prisma.userVocabulary.delete({ where: { id: vocabularyId } });

    return { ok: true };
  }

  /* ───────────────────────────── Helpers ───────────────────────────── */

  private async ensureOwned(userId: string, id: bigint) {
    const existing = await this.prisma.userVocabulary.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy từ vựng.');
    }
  }

  private parseId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new BadRequestException('Mã từ vựng không hợp lệ.');
    }
  }

  private toDbStatus(status?: string) {
    return status === 'mastered' ? 'MASTERED' : 'LEARNING';
  }

  private normalizeError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('Từ này đã có trong sổ từ vựng của bạn.');
    }

    return error;
  }

  private toResponse(row: VocabularyRow) {
    return {
      id: row.id.toString(),
      word: row.word,
      phonetic: row.phonetic,
      partOfSpeech: row.partOfSpeech,
      meaning: row.meaning,
      example: row.example,
      exampleTranslation: row.exampleTranslation,
      status: row.status === 'MASTERED' ? 'mastered' : 'learning',
      isFavorite: row.isFavorite,
      audioUrl: row.audioUrl,
      lastReviewedAt: row.lastReviewedAt
        ? row.lastReviewedAt.toISOString()
        : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
