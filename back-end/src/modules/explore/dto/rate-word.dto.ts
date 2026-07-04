import { IsIn } from 'class-validator';

const WORD_RATINGS = ['easy', 'medium', 'hard', 'known'] as const;
export type WordRatingValue = (typeof WORD_RATINGS)[number];

export class RateWordDto {
  @IsIn(WORD_RATINGS)
  rating!: WordRatingValue;
}
