import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Username phải là chuỗi ký tự' })
  @Length(3, 30, { message: 'Username phải từ 3 đến 30 ký tự' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Tone banner phải là chuỗi ký tự' })
  bannerTone?: string;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @Length(2, 50, { message: 'Họ và tên phải từ 2 đến 50 ký tự' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi ký tự' })
  avatarUrl?: string;
}
