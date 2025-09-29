import { IsBoolean, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
