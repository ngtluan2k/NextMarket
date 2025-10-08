// backend/src/modules/user/dto/password-reset.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordByOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 số' })
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword!: string;
}
