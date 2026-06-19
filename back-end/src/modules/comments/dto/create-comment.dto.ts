import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Nội dung phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @MinLength(1, { message: 'Nội dung không được để trống' })
  @MaxLength(2000, { message: 'Nội dung tối đa 2000 ký tự' })
  content!: string;

  @IsOptional()
  @IsNumberString({}, { message: 'parentId không hợp lệ' })
  parentId?: string;
}
