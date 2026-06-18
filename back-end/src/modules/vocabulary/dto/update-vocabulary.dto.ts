import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VOCAB_POS, VOCAB_STATUS } from './create-vocabulary.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateVocabularyDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Từ vựng không được để trống.' })
  @MaxLength(120)
  word?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Nghĩa của từ không được để trống.' })
  @MaxLength(2000)
  meaning?: string;

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
