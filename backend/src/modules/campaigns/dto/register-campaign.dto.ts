// dto/register-campaign.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class RegisterCampaignItemDto {
  @IsNumber()
  productId!: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsOptional()
  @IsNumber()
  promoPrice?: number;
}

export class RegisterCampaignStoreDto {
  @IsNumber()
  campaignId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterCampaignItemDto)
  items!: RegisterCampaignItemDto[];
}
