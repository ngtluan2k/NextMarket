import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  recipientName!: string;

  @IsString()
  phone!: string;

  @IsString()
  street!: string;

  @IsString()
  ward!: string;

  @IsString()
  district!: string;

  @IsString()
  province!: string;

  @IsString()
  @IsOptional()
  country?: string = 'Việt Nam';

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;

  // GHN fields (optional - sẽ tự động map)
  @IsNumber()
  @IsOptional()
  ghn_province_id?: number;

  @IsNumber()
  @IsOptional()
  ghn_district_id?: number;

  @IsString()
  @IsOptional()
  ghn_ward_code?: string;

  @IsNumber()
  @IsOptional()
  user_id?: number;
}