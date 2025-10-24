
export interface CampaignImageDto {
  file: Express.Multer.File;
  link_url?: string;
  position?: number;
}

export interface CampaignSectionItemDto {
  type: 'product' | 'voucher' | 'image' | 'html';
  item_id?: number;
  extra_data?: any;
}

export interface CampaignSectionDto {
  type: string;
  title: string;
  position?: number;
  config_json?: any;
  items?: CampaignSectionItemDto[];
}

export interface CampaignVoucherDto {
  voucher_id: number;
  type?: 'system' | 'store';
}

export interface CampaignStoreProductDto {
  storeId: number;
  productId: number;
  variantId?: number;
  promoPrice?: number;
}

export class PublishCampaignDto {
  campaignId!: number;
  images?: CampaignImageDto[];
  sections?: CampaignSectionDto[];
  vouchers?: CampaignVoucherDto[];
  storeProducts?: CampaignStoreProductDto[];
}
