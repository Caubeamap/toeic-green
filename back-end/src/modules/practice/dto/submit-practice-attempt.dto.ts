import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SubmitPracticeAttemptDto {
  @IsIn(['PRACTICE', 'FULL_TEST'])
  mode!: 'PRACTICE' | 'FULL_TEST';

  @IsInt()
  @Min(0)
  @Max(24 * 60 * 60)
  durationSeconds!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  timeLimitMinutes!: number;

  @IsArray()
  questionIds!: string[];

  @IsObject()
  answers!: Record<string, string>;

  @IsOptional()
  @IsArray()
  flaggedQuestionIds?: string[];
}
