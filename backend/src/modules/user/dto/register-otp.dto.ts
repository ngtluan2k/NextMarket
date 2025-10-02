// backend/src/modules/user/dto/register-otp.dto.ts
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// B1: Gửi OTP chỉ cần email, reuse validator từ CreateUserDto
export class RequestRegisterOtpDto extends PickType(CreateUserDto, ['email'] as const) {}

// B2: Xác thực OTP + tạo tài khoản: dùng toàn bộ CreateUserDto + thêm code
export class VerifyRegisterOtpDto extends CreateUserDto {
  @ApiProperty({ description: 'Mã OTP 6 số' })
  @IsNotEmpty()
  code!: string;
}