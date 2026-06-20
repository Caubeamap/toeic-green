import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../../common/utils/normalize-email';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @MaxLength(254, { message: 'Email không được vượt quá 254 ký tự' })
  email!: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(6, 128, { message: 'Mật khẩu phải từ 6 đến 128 ký tự' })
  password!: string;

  @IsOptional()
  @IsBoolean({
    message: 'Ghi nhớ đăng nhập phải là true hoặc false',
  })
  rememberMe?: boolean;
}
