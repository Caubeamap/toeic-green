import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Tiểu sử không được vượt quá 500 ký tự' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Tone banner phải là chuỗi ký tự' })
  @IsIn(['mint', 'sky', 'sunrise'], {
    message: 'Tone banner không hợp lệ',
  })
  bannerTone?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @Length(2, 50, { message: 'Họ và tên phải từ 2 đến 50 ký tự' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi ký tự' })
  @MaxLength(2048, {
    message: 'Ảnh đại diện không được vượt quá 2048 ký tự',
  })
  avatarUrl?: string;
}
