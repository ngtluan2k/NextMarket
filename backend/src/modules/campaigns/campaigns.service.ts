import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { randomUUID } from 'crypto';
import { CampaignStore } from './entities/campaign_stores.ts.entity';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import { RegisterCampaignStoreDto } from './dto/register-campaign.dto';
import { Store } from '../store/store.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignStoreProduct } from './entities/campaign_store_products.entity';
import { DeepPartial } from 'typeorm/common/DeepPartial';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignStore)
    private readonly campaignStoreRepo: Repository<CampaignStore>,
    @InjectRepository(CampaignStoreProduct)
    private readonly campaignStoreProductRepo: Repository<CampaignStoreProduct>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<any>
  ) {}
  async createCampaign(
    dto: CreateCampaignDto,
    adminId: number
  ): Promise<Campaign> {
    const publish = dto.publish === 'true';

    const campaign = this.campaignRepo.create({
      uuid: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      starts_at: dto.startsAt,
      ends_at: dto.endsAt,
      banner_url: dto.bannerUrl,
      status: publish ? 'pending' : 'draft',
      created_by: adminId,
    });
    return this.campaignRepo.save(campaign);
  }

  // campaigns.service.ts
  async getAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepo.find({
      order: { starts_at: 'DESC' },
      relations: ['images', 'vouchers', 'sections', 'stores.store'], // load quan hệ nếu cần
    });
  }


   async getCampaignStoreDetail(campaignId: number, storeId: number) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: [
        'stores.store',             // store info
        'stores.products',          // sản phẩm store đăng ký trong campaign
        'stores.products.product.variants',// variant nếu có
      ],
    });

    if (!campaign) throw new NotFoundException('Campaign không tồn tại');

    // tìm store
    const store = campaign.stores.find((s) => s.store.id === storeId);
    if (!store) throw new NotFoundException('Store không tham gia campaign');

    // trả về store + danh sách sản phẩm
    return {
      campaignId: campaign.id,
      storeId: store.store.id,
      storeName: store.store.name,
      products: store.products || [],
      status: store.status,
      registeredAt: store.registeredAt,
      approvedAt: store.approvedAt,
      rejectedReason: store.rejectedReason,
    };
  }

  // GET danh sách campaign active
  async getPendingCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return this.campaignRepo.find({
      where: {
        starts_at: LessThanOrEqual(now),
        ends_at: MoreThanOrEqual(now),
        status: 'pending',
      },
      relations: ['stores', 'stores.store'], // load campaignStores + store
      order: { starts_at: 'ASC' },
    });
  }

  // Store đăng ký tham gia
  async registerStoreForCampaign(
    dto: RegisterCampaignStoreDto,
    userId: number
  ) {
    const { campaignId, items } = dto;

    // 🏪 Lấy store của user
    const store = await this.storeRepo.findOne({
      where: { user_id: userId, is_deleted: false },
    });
    if (!store) throw new NotFoundException('Store của bạn không tồn tại');

    // 🎯 Lấy campaign
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: ['stores', 'stores.store'],
    });
    if (!campaign) throw new NotFoundException('Campaign không tồn tại');

    // 🔍 Kiểm tra xem store đã có trong campaign chưa
    let campaignStore = campaign.stores.find((s) => s.store?.id === store.id);

    if (!campaignStore) {
      campaignStore = this.campaignStoreRepo.create({
        campaign,
        store,
        status: 'approved',
        registeredAt: new Date(),
        approvedAt: new Date(),
      });
      campaignStore = await this.campaignStoreRepo.save(campaignStore);
    } else {
      campaignStore.status = 'approved';
      campaignStore.approvedAt = new Date();
      await this.campaignStoreRepo.save(campaignStore);
    }

    // 🧹 Xóa sản phẩm cũ trong campaign này (nếu có)
    await this.campaignStoreProductRepo.delete({
      campaignStore: { id: campaignStore.id },
    });

    // ➕ Tạo danh sách sản phẩm mới
    const newProducts = items.map((item) => ({
      campaignStore: { id: campaignStore.id },
      product: { id: item.productId },
      variant: item.variantId ? { id: item.variantId } : undefined,
      promoPrice: item.promoPrice ?? undefined, // KHÔNG dùng null nữa
      status: 'approved',
      registeredAt: new Date(),
      approvedAt: new Date(),
    })) as DeepPartial<CampaignStoreProduct>[];

    await this.campaignStoreProductRepo.save(
      this.campaignStoreProductRepo.create(newProducts)
    );

    return {
      message: 'Đăng ký campaign thành công',
      storeId: store.id,
      campaignStoreId: campaignStore.id,
      totalItems: newProducts.length,
    };
  }

  async approveStore(campaignStoreId: number): Promise<CampaignStore> {
    const cs = await this.campaignStoreRepo.findOne({
      where: { id: campaignStoreId },
      relations: ['store', 'campaign'],
    });

    if (!cs) throw new NotFoundException('Không tìm thấy đăng ký này');

    if (cs.status === 'approved')
      throw new BadRequestException('Cửa hàng này đã được duyệt');

    cs.status = 'approved';
    cs.approvedAt = new Date();
    return this.campaignStoreRepo.save(cs);
  }

  async rejectStore(
    campaignStoreId: number,
    reason: string
  ): Promise<CampaignStore> {
    const cs = await this.campaignStoreRepo.findOne({
      where: { id: campaignStoreId },
    });

    if (!cs) throw new NotFoundException('Không tìm thấy đăng ký này');

    cs.status = 'rejected';
    cs.rejectedReason = reason;
    return this.campaignStoreRepo.save(cs);
  }

  async getCampaignDetailForStore(campaignId: number, userId: number) {
  // Lấy store của user
  const store = await this.storeRepo.findOne({
    where: { user_id: userId, is_deleted: false },
  });
  if (!store) throw new NotFoundException('Store của bạn không tồn tại');

  // Lấy campaign
  const campaign = await this.campaignRepo.findOne({
    where: { id: campaignId },
    relations: ['stores', 'stores.store', 'stores.products', 'stores.products.variant', 'stores.products.product'],
  });
  if (!campaign) throw new NotFoundException('Campaign không tồn tại');

  // Lấy thông tin store trong campaign
  const campaignStore = campaign.stores.find((s) => s.store?.id === store.id);

  return {
    campaign,
    registeredStore: campaignStore || null,
  };
}


  async getCurrentlyActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return this.campaignRepo.find({
      where: {
        starts_at: LessThanOrEqual(now),
        ends_at: MoreThanOrEqual(now),
        status: 'active',
      },
      order: { starts_at: 'ASC' },
    });
  }
}
