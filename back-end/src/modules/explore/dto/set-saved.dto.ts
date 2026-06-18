import { IsBoolean } from 'class-validator';

export class SetSavedDto {
  @IsBoolean()
  isSaved!: boolean;
}
