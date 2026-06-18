import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const VOCAB_POS = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
] as const;
export const VOCAB_STATUS = ['learning', 'mastered'] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateVocabularyDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Từ vựng không được để trống.' })
  @MaxLength(120)
  word!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Nghĩa của từ không được để trống.' })
  @MaxLength(2000)
  meaning!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  phonetic?: string;

  @IsOptional()
  @IsIn(VOCAB_POS, { message: 'Loại từ không hợp lệ.' })
  partOfSpeech?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  example?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleTranslation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  audioUrl?: string;

  @IsOptional()
  @IsIn(VOCAB_STATUS, { message: 'Trạng thái không hợp lệ.' })
  status?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
