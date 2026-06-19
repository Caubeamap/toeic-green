import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GoogleLoginDto {
  // `credential` là Google ID token (JWT) do Google Identity Services trả về ở
  // frontend. Giới hạn độ dài để chặn payload bất thường; chữ ký/aud/exp được
  // GoogleTokenVerifier kiểm tra ở tầng service.
  @IsString({ message: 'Credential không hợp lệ' })
  @IsNotEmpty({ message: 'Credential không được để trống' })
  @MaxLength(4096, { message: 'Credential không hợp lệ' })
  credential!: string;
}
