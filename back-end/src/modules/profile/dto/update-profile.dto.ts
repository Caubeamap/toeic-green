import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsInt({ message: 'Điểm mục tiêu phải là số nguyên' })
  @Min(10, { message: 'Điểm mục tiêu tối thiểu là 10' })
  @Max(990, { message: 'Điểm mục tiêu tối đa là 990' })
  targetScore?: number;

  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Tone banner phải là chuỗi ký tự' })
  bannerTone?: string;

  @IsOptional()
  @IsInt({ message: 'Số giờ học mỗi tuần phải là số nguyên' })
  @Min(0, { message: 'Số giờ học không được âm' })
  @Max(168, { message: 'Số giờ học tối đa mỗi tuần là 168 giờ' })
  studyHoursPerWeek?: number;
}
