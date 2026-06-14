import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString({ message: 'Tên hiển thị phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên hiển thị không được để trống' })
  @MinLength(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự' })
  displayName: string;
}
