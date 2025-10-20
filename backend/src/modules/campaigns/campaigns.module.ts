import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignStore } from './entities/campaign_stores.ts.entity';
import { CampaignSection } from './entities/campaign_sections.entity';
import { CampaignSectionItem } from './entities/campaign_section_items.entity';
import { CampaignImage } from './entities/campaign_images.entity';
import { CampaignVoucher } from './entities/campaign_vouchers.entity';
import { CampaignStoreProduct } from './entities/campaign_store_products.entity';
import { Store } from '../store/store.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      CampaignStore,
      CampaignStoreProduct, 
      CampaignSection,
      CampaignSectionItem,
      CampaignImage,
      CampaignVoucher,
      Store
    ]), // 🔹 Thêm repository vào module
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
