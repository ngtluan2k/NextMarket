import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsFullName } from './validate/full-name.validator';
import { IsDobValid } from './validate/dob.validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Username của user' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\S+$/, { message: 'Username không được chứa khoảng trắng' })
  username!: string;

  @ApiProperty({ description: 'Full name của user' })
  @IsNotEmpty()
  @IsString()
  @Validate(IsFullName)
  full_name!: string;

  @ApiProperty({ description: 'Ngày sinh', type: String, format: 'date' })
  @IsNotEmpty()
  @Validate(IsDobValid)
  dob!: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Số điện thoại phải đủ 10 số' })
  phone!: string;

  @ApiProperty({ description: 'Giới tính' })
  @IsNotEmpty()
  @IsString()
  gender!: string;

  @ApiProperty({ description: 'Email' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ description: 'Mật khẩu' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải trên 6 ký tự' })
  @Matches(/(?=.*[a-z])/, { message: 'Mật khẩu phải có chữ thường' })
  @Matches(/(?=.*[A-Z])/, { message: 'Mật khẩu phải có chữ hoa' })
  @Matches(/(?=.*\d)/, { message: 'Mật khẩu phải có số' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Mật khẩu phải có ký tự đặc biệt' })
  password!: string;

  @ApiPropertyOptional({ description: 'Country của user' })
  @IsOptional()
  @IsString()
  country?: string;
}
