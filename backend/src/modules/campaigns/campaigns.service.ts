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
import { CampaignSection } from './entities/campaign_sections.entity';
import { CampaignSectionItem } from './entities/campaign_section_items.entity';
import { CampaignImage } from './entities/campaign_images.entity';
import { CampaignVoucher } from './entities/campaign_vouchers.entity';
import { PublishCampaignDto } from './dto/campaign-publish.dto';
import { Voucher } from '../vouchers/vouchers.entity';
import { CampaignVoucherDto } from './dto/campaign-publish.dto';
import { In } from 'typeorm';

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
    private readonly storeRepo: Repository<any>,
    @InjectRepository(CampaignSection)
    private readonly campaignSectionsRepo: Repository<CampaignSection>,
    @InjectRepository(CampaignSectionItem)
    private readonly campaignSectionItemsRepo: Repository<CampaignSectionItem>,
    @InjectRepository(CampaignImage)
    private readonly campaignImagesRepo: Repository<CampaignImage>,
    @InjectRepository(CampaignVoucher)
    private readonly campaignVouchersRepo: Repository<CampaignVoucher>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>
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
      backgroundColor: dto.backgroundColor,
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
        'stores.store',
        'stores.products',
        'stores.products.product',
        'stores.products.variant', // 👈 thêm dòng này
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
      relations: [
        'stores',
        'stores.store',
        'stores.products',
        'stores.products.variant',
        'stores.products.product',
      ],
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

  async publishCampaign(dto: PublishCampaignDto, currentUser: any) {
    console.log(
      '>>> publishCampaign called with DTO:',
      JSON.stringify(dto, null, 2)
    );
    console.log('>>> currentUser:', currentUser);

    if (!currentUser.roles.includes('Admin')) {
      throw new BadRequestException('Chỉ admin mới publish campaign');
    }

    const campaign = await this.campaignRepo.findOne({
      where: { id: dto.campaignId },
    });
    if (!campaign) throw new BadRequestException('Campaign not found');

    // Log voucher DTO trước khi vòng lặp
    console.log('>>> DTO.vouchers:', dto.vouchers);

    // 1. Cập nhật status campaign
    campaign.status = 'active';
    await this.campaignRepo.save(campaign);

    // 2. Lưu images (log luôn payload image)
    if (dto.images?.length) {
      console.log('>>> DTO.images:', dto.images);
      for (let i = 0; i < dto.images.length; i++) {
        const imgDto = dto.images[i];
        const img = new CampaignImage();
        img.campaign = campaign;
        img.imageUrl = `/uploads/banners/${imgDto.file.filename}`;
        img.position = imgDto.position ?? i;
        img.linkUrl = imgDto.link_url ?? undefined;
        await this.campaignImagesRepo.save(img);
      }
    }

    // 3. Lưu sections + items
    if (dto.sections?.length) {
      console.log('>>> DTO.sections:', dto.sections);
      for (const secDto of dto.sections) {
        // Kiểm tra section đã tồn tại chưa
        let section = await this.campaignSectionsRepo.findOne({
          where: { campaign: { id: campaign.id }, title: secDto.title },
        });

        if (!section) {
          section = new CampaignSection();
          section.campaign = campaign;
          section.type = secDto.type;
          section.title = secDto.title;
          section.position = secDto.position ?? 0;
          section.configJson = secDto.config_json ?? undefined;

          await this.campaignSectionsRepo.save(section);
        }

        if (secDto.items?.length) {
          for (const item of secDto.items) {
            // Kiểm tra item đã tồn tại chưa
            const existItem = await this.campaignSectionItemsRepo.findOne({
              where: {
                section: { id: section.id },
                itemId: item.item_id,
                itemType: item.type,
              },
            });
            if (existItem) continue;

            const sectionItem = new CampaignSectionItem();
            sectionItem.section = section;
            sectionItem.itemType = item.type;
            sectionItem.itemId = item.item_id ?? undefined;
            sectionItem.extraData = item.extra_data ?? undefined;

            await this.campaignSectionItemsRepo.save(sectionItem);
          }
        }
      }
    }

    // 4. Lưu vouchers
    let vouchers: CampaignVoucherDto[] = [];
    if (dto.vouchers) {
      if (typeof dto.vouchers === 'string') {
        try {
          vouchers = JSON.parse(dto.vouchers);
        } catch (err) {
          console.error('Cannot parse vouchers:', dto.vouchers);
          vouchers = [];
        }
      } else {
        vouchers = dto.vouchers;
      }
    }

    for (const v of vouchers) {
      console.log('>>> Processing voucher DTO:', v);
      if (!v.voucher_id) continue;
      const voucherEntity = await this.voucherRepo.findOne({
        where: { id: v.voucher_id },
      });
      console.log('>>> voucherEntity:', voucherEntity);
      if (!voucherEntity) {
        console.warn('Voucher not found:', v.voucher_id);
        continue;
      }

      const campaignVoucher = new CampaignVoucher();
      campaignVoucher.campaign = campaign;
      campaignVoucher.voucher = voucherEntity;
      campaignVoucher.type = v.type === 'store' ? 'store' : 'system';

      console.log('>>> Saving campaignVoucher:', {
        campaignId: campaign.id,
        voucherId: voucherEntity.id,
        type: campaignVoucher.type,
      });

      await this.campaignVouchersRepo.save(campaignVoucher);
    }

    return { success: true, campaignId: dto.campaignId };
  }

  async getCampaignProducts(campaignId: number) {
    // Lấy tất cả store đã được duyệt trong campaign
    const campaignStores = await this.campaignStoreRepo.find({
      where: {
        campaign: { id: campaignId },
        status: 'approved',
      },
      relations: ['store', 'products', 'products.product', 'products.variant'],
    });

    // Dễ đọc hơn nếu bạn chỉ trả ra những gì admin cần xem
    return campaignStores.map((cs) => ({
      storeId: cs.store.id,
      storeName: cs.store.name,
      products: cs.products.map((p) => ({
        id: p.id,
        productName: p.product.name,
        variantName: p.variant?.variant_name || null,
        basePrice: p.variant?.price ?? p.product.base_price,
        promoPrice: p.promo_price,
        status: p.status,
      })),
    }));
  }

  async getCampaignDetail(campaignId: number) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign không tồn tại');

    // 1️⃣ Lấy banner/images
    const images = await this.campaignImagesRepo.find({
      where: { campaign: { id: campaignId } },
      order: { position: 'ASC' },
    });

    // 2️⃣ Lấy vouchers
    const vouchers = await this.campaignVouchersRepo.find({
      where: { campaign: { id: campaignId } },
      relations: ['voucher'],
    });

    // 3️⃣ Lấy stores và products trong chiến dịch
    const campaignStores = await this.campaignStoreRepo.find({
      where: { campaign: { id: campaignId } },
      relations: [
        'store',
        'products',
        'products.product',
        'products.variant',
        'products.product.media',
      ],
    });

    const stores = campaignStores.map((cs) => ({
      id: cs.store.id,
      name: cs.store.name,
      status: cs.status,
      products: cs.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        slug: p.product.slug,
        base_price: p.product.base_price,
        variant: p.variant
          ? {
              id: p.variant.id,
              variant_name: p.variant.variant_name,
              price: p.variant.price,
            }
          : undefined,
        promo_price: p.promo_price,
        status: p.status,
        imageUrl: p.product.media?.[0]?.url || undefined,
      })),
    }));

    // 4️⃣ Trả về dữ liệu tổng hợp
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
      backgroundColor: campaign.backgroundColor,
      banner_url: campaign.banner_url,
      status: campaign.status,
      images,
      vouchers: vouchers.map((cv) => ({
        id: cv.voucher.id,
        title: cv.voucher.title,
        discount_value: cv.voucher.discount_value,
        type: cv.type,
      })),
      stores,
    };
  }

  async getCampaignForUser(id: number) {
    const campaign = await this.campaignRepo.findOne({
      where: { id, status: 'active' },
    });
    if (!campaign) return null;

    // 1️⃣ Lấy banner/images
    const images = await this.campaignImagesRepo.find({
      where: { campaign: { id } },
      order: { position: 'ASC' },
    });

    // 3️⃣ Lấy vouchers
    const vouchers = await this.campaignVouchersRepo.find({
      where: { campaign: { id } },
      relations: ['voucher'],
    });

    // 4️⃣ Lấy campaign_store + sản phẩm đã đăng ký
    const campaignStores = await this.campaignStoreRepo.find({
      where: { campaign: { id } },
      relations: [
        'store',
        'products',
        'products.product',
        'products.variant',
        'products.product.media',
      ], // thêm media
    });

    // Map stores + products
    const stores = campaignStores.map((cs) => ({
      id: cs.store.id,
      name: cs.store.name,
      status: cs.status,
      products: cs.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        slug: p.product.slug,
        base_price: p.product.base_price,
        variant: p.variant
          ? {
              id: p.variant.id,
              variant_name: p.variant.variant_name,
              price: p.variant.price,
            }
          : undefined,
        promo_price: p.promo_price,
        status: p.status,
        imageUrl: p.product.media?.[0]?.url || undefined, // lấy hình đầu tiên nếu có
      })),
    }));

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
      backgroundColor: campaign.backgroundColor,
      images,
      vouchers: vouchers.map((cv) => ({
        id: cv.voucher.id,
        title: cv.voucher.title,
        discount_value: cv.voucher.discount_value,
        type: cv.type,
      })),
      stores,
    };
  }

  async updateCampaign(dto: UpdateCampaignDto, currentUser: any) {
    console.log(
      '>>> updateCampaign called with DTO:',
      JSON.stringify(dto, null, 2)
    );
    console.log('>>> currentUser:', currentUser);

    if (!currentUser.roles.includes('Admin')) {
      throw new BadRequestException(
        'Chỉ admin mới được phép cập nhật campaign'
      );
    }

    const campaign = await this.campaignRepo.findOne({
      where: { id: dto.campaignId },
    });
    if (!campaign) throw new BadRequestException('Không tìm thấy campaign');

    // 1️⃣ Cập nhật thông tin cơ bản
    campaign.name = dto.name ?? campaign.name;
    campaign.description = dto.description ?? campaign.description;
    campaign.starts_at = dto.startsAt ?? campaign.starts_at;
    campaign.ends_at = dto.endsAt ?? campaign.ends_at;
    campaign.banner_url = dto.bannerUrl ?? campaign.banner_url;
    campaign.backgroundColor = dto.backgroundColor ?? campaign.backgroundColor;
    campaign.status = dto.status ?? campaign.status; // 👈 thêm trường status mới

    await this.campaignRepo.save(campaign);

    // 2️⃣ Cập nhật images nếu có
    // 2️⃣ Cập nhật images nếu có
    if (dto.removedImages?.length) {
      console.log('>>> Xoá ảnh cũ:', dto.removedImages);
      await this.campaignImagesRepo.delete({
        id: In(dto.removedImages),
        campaign: { id: campaign.id },
      });
    }

    if (dto.images?.length) {
      console.log('>>> Thêm ảnh mới:', dto.images);
      for (let i = 0; i < dto.images.length; i++) {
        const imgDto = dto.images[i];
        const img = new CampaignImage();
        img.campaign = campaign;
        img.imageUrl = `/uploads/banners/${imgDto.file.filename}`;
        img.position = imgDto.position ?? i;
        img.linkUrl = imgDto.link_url ?? undefined;
        await this.campaignImagesRepo.save(img);
      }
    }

    // 3️⃣ Cập nhật sections (ghi đè toàn bộ hoặc merge tùy nhu cầu)
    if (dto.sections?.length) {
      console.log('>>> DTO.sections:', dto.sections);

      // Xóa toàn bộ section cũ trước khi thêm mới (nếu cần)
      await this.campaignSectionsRepo.delete({ campaign: { id: campaign.id } });

      for (const secDto of dto.sections) {
        const section = new CampaignSection();
        section.campaign = campaign;
        section.type = secDto.type;
        section.title = secDto.title;
        section.position = secDto.position ?? 0;
        section.configJson = secDto.config_json ?? undefined;
        await this.campaignSectionsRepo.save(section);

        if (secDto.items?.length) {
          for (const item of secDto.items) {
            const sectionItem = new CampaignSectionItem();
            sectionItem.section = section;
            sectionItem.itemType = item.type;
            sectionItem.itemId = item.item_id ?? undefined;
            sectionItem.extraData = item.extra_data ?? undefined;
            await this.campaignSectionItemsRepo.save(sectionItem);
          }
        }
      }
    }

    // 4️⃣ Cập nhật vouchers
    let vouchers: CampaignVoucherDto[] = [];
    if (dto.vouchers) {
      if (typeof dto.vouchers === 'string') {
        try {
          vouchers = JSON.parse(dto.vouchers);
        } catch (err) {
          console.error('Cannot parse vouchers:', dto.vouchers);
          vouchers = [];
        }
      } else {
        vouchers = dto.vouchers;
      }
    }

    if (vouchers.length) {
      console.log('>>> DTO.vouchers:', vouchers);
      // Xóa voucher cũ trước khi thêm mới
      await this.campaignVouchersRepo.delete({ campaign: { id: campaign.id } });

      for (const v of vouchers) {
        if (!v.voucher_id) continue;
        const voucherEntity = await this.voucherRepo.findOne({
          where: { id: v.voucher_id },
        });
        if (!voucherEntity) {
          console.warn('Voucher not found:', v.voucher_id);
          continue;
        }

        const campaignVoucher = new CampaignVoucher();
        campaignVoucher.campaign = campaign;
        campaignVoucher.voucher = voucherEntity;
        campaignVoucher.type = v.type === 'store' ? 'store' : 'system';
        await this.campaignVouchersRepo.save(campaignVoucher);
      }
    }

    console.log('>>> Campaign updated successfully:', campaign.id);
    return { success: true, campaignId: dto.campaignId };
  }
}
