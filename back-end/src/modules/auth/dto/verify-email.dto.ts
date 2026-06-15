import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Token xác minh không hợp lệ' })
  @IsNotEmpty({ message: 'Token xác minh không được để trống' })
  @Length(64, 64, { message: 'Token xác minh không hợp lệ' })
  token!: string;
}
