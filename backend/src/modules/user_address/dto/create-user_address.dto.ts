import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateUserAddressDto {
  @IsNumber()
  user_id!: number;

  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsOptional() // Cho phép province là tùy chọn và có thể rỗng
  province?: string;

  @IsString()
  @IsOptional() // Cho phép country là tùy chọn và có thể rỗng
  country?: string;

  @IsString()
  @IsOptional() // Cho phép postalCode là tùy chọn và có thể rỗng
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
