import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GoogleLoginDto {
  // `credential` = Google ID token (luồng cũ, GIS renderButton). `code` =
  // authorization code (luồng mới, nút tự vẽ + initCodeClient popup). Nhận MỘT
  // trong hai; controller chặn nếu thiếu cả hai. Chữ ký/aud/exp được
  // GoogleTokenVerifier kiểm tra ở tầng service.
  @IsOptional()
  @IsString({ message: 'Credential không hợp lệ' })
  @MaxLength(4096, { message: 'Credential không hợp lệ' })
  credential?: string;

  @IsOptional()
  @IsString({ message: 'Mã đăng nhập Google không hợp lệ' })
  @MaxLength(4096, { message: 'Mã đăng nhập Google không hợp lệ' })
  code?: string;
}
