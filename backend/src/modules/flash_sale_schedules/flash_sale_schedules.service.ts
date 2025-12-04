import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { FlashSaleSchedule } from './entities/flash_sale_schedule.entity';
import { CreateFlashSaleScheduleDto } from './dto/create-flash_sale_schedule.dto';
import { StoreLevel } from '../store-level/store-level.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RegisterFlashSaleDto } from './dto/register-flash_sale.dto';
import { Product } from '../product/product.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { UpdateFlashSaleScheduleDto } from './dto/update-flash_sale_schedule.dto';

@Injectable()
export class FlashSaleSchedulesService {
  constructor(
    @InjectRepository(FlashSaleSchedule)
    private readonly scheduleRepo: Repository<FlashSaleSchedule>,

    @InjectRepository(StoreLevel)
    private readonly storeLevelRepo: Repository<StoreLevel>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(PricingRules)
    private readonly pricingRulesRepo: Repository<PricingRules>
  ) {}

  ///////////////////////////////ADMIN///////////////////////////

  async create(dto: CreateFlashSaleScheduleDto) {
    // 1️⃣ Tạo flash sale schedule
    const schedule = this.scheduleRepo.create({
      name: dto.name,
      description: dto.description ?? undefined,
      starts_at: new Date(dto.starts_at),
      ends_at: new Date(dto.ends_at),
      status: 'upcoming',
    });

    await this.scheduleRepo.save(schedule);

    // 2️⃣ Lấy danh sách store premium
    const premiumStores = await this.storeLevelRepo.find({
      where: { level: 'premium' as any },
      relations: ['store'],
    });

    // 3️⃣ Gửi thông báo cho từng store premium
    // (sau có thể đẩy qua Notification hoặc Email)
    console.log('📢 Gửi flash sale đến store premium:', premiumStores.length);
    for (const s of premiumStores) {
      console.log(` - ${s.store.name} (id: ${s.store.id})`);
      // TODO: thêm logic insert Notification
    }

    return {
      message: 'Flash sale schedule created successfully',
      schedule,
      targetStores: premiumStores.map((s) => s.store.id),
    };
  }

  async updateSchedule(scheduleId: number, dto: UpdateFlashSaleScheduleDto) {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Flash sale schedule không tồn tại');

    Object.assign(schedule, dto); // gán các trường có trong DTO
    return this.scheduleRepo.save(schedule);
  }

  async findAllForAdmin(reqUser: any) {
    if (!reqUser.roles.includes('Admin')) {
      throw new ForbiddenException(
        'Chỉ admin mới xem được danh sách flash sale'
      );
    }

    const schedules = await this.scheduleRepo.find({
      order: { created_at: 'DESC' },
    });

    return { total: schedules.length, data: schedules };
  }

  // flash-sale-schedules.service.ts
async getRegisteredProductsForAdmin(scheduleId: number) {
  const rules = await this.pricingRulesRepo.find({
    where: { schedule: { id: scheduleId } },
    relations: ['product', 'variant', 'product.store'],
  });

  return rules
    .filter((r) => r.product && r.product.store) // 👈 bỏ rule không có product hoặc store
    .map((rule) => ({
      id: rule.id,
      product_id: rule.product.id,
      product_name: rule.product.name,
      variant_id: rule.variant?.id,
      variant_name: rule.variant?.variant_name,
      original_price: rule.variant?.price,
      price: rule.price,
      limit_quantity: rule.limit_quantity,
      store: {
        id: rule.product.store.id,
        name: rule.product.store.name,
      },
      status: rule.status,
    }));
}


///////////////////////////////STORE/////////////////////////////////

  // 🧱 3️⃣ STORE xem tất cả flash sale (mọi trạng thái)
  async findAllForStore(reqUser: any) {
    // Không cần quyền đặc biệt, chỉ cần login
    const schedules = await this.scheduleRepo.find({
      order: { starts_at: 'ASC' },
    });

    return { total: schedules.length, data: schedules };
  }

  async registerStoreFlashSale(storeId: number, dto: RegisterFlashSaleDto) {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: dto.schedule_id },
    });
    if (!schedule)
      throw new NotFoundException('Flash sale schedule không tồn tại');

    // Lấy danh sách product + variant của store
    const products = await this.productRepo.find({
      where: { store: { id: storeId } },
      relations: ['variants'],
    });

    const pricingRulesToCreate = [];

    for (const item of dto.product_variant_ids) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue; // bỏ qua nếu không thuộc store

      const variant = item.variant_id
        ? product.variants.find((v) => v.id === item.variant_id)
        : undefined;

      pricingRulesToCreate.push(
        this.pricingRulesRepo.create({
          product,
          variant,
          name: `${schedule.name} - ${product.name}${
            variant ? ' - ' + variant.variant_name : ''
          }`,
          type: 'flash_sale',
          price: item.price,
          limit_quantity: item.limit_quantity,
          status: 'active',
          schedule,
        })
      );
    }

    await this.pricingRulesRepo.save(pricingRulesToCreate);

    return {
      message: 'Đăng ký flash sale thành công',
      count: pricingRulesToCreate.length,
    };
  }

async getRegisteredProductsForStore(scheduleId: number, storeId: number) {
  const rules = await this.pricingRulesRepo.find({
    where: {
      schedule: { id: scheduleId },
      product: { store: { id: storeId } },
      type: 'flash_sale',
    },
    relations: ['product', 'variant'],
  });

  return rules
    .filter((r) => r.product) // 👈 bỏ rule bị null product
    .map((rule) => ({
      id: rule.id,
      product_id: rule.product.id,
      product_name: rule.product.name,
      variant_id: rule.variant?.id,
      variant_name: rule.variant?.variant_name,
      price: rule.price,
      limit_quantity: rule.limit_quantity,
      starts_at: rule.starts_at,
      ends_at: rule.ends_at,
      status: rule.status,
      is_registered: true,
    }));
}



async updateStoreFlashSaleRegistration(
  scheduleId: number,
  storeId: number,
  dto: RegisterFlashSaleDto,
) {
  const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
  if (!schedule) throw new NotFoundException('Flash sale schedule không tồn tại');

  // Lấy tất cả pricing_rules hiện tại của store trong flash sale này
  const existingRules = await this.pricingRulesRepo.find({
    where: {
      schedule: { id: scheduleId },
      product: { store: { id: storeId } },
    },
    relations: ['product', 'variant'],
  });

  // Map product + variant ID -> rule, bỏ qua các rule thiếu product
  const ruleMap = new Map<string, any>();
  for (const r of existingRules) {
    if (!r.product) continue; // an toàn với null
    const key = `${r.product.id}-${r.variant?.id ?? 0}`;
    ruleMap.set(key, r);
  }

  // Cập nhật hoặc tạo mới pricing rules dựa trên dto
  for (const item of dto.product_variant_ids) {
    if (item.price === undefined || item.limit_quantity === undefined) continue;

    const key = `${item.product_id}-${item.variant_id ?? 0}`;
    const rule = ruleMap.get(key);

    if (rule) {
      // Cập nhật giá & số lượng, an toàn
      rule.price = item.price;
      rule.limit_quantity = item.limit_quantity;
      rule.status = item.price > 0 ? 'active' : 'inactive';
      await this.pricingRulesRepo.save(rule);
    } else {
      // Tạo mới, kiểm tra product tồn tại
      const product = await this.productRepo.findOne({
        where: { id: item.product_id, store: { id: storeId } },
        relations: ['variants'],
      });
      if (!product) continue; // bỏ qua nếu product null

      const variant = item.variant_id
        ? product.variants.find((v) => v.id === item.variant_id)
        : undefined;

      const newRule = this.pricingRulesRepo.create({
        product,
        variant,
        name: `${schedule.name} - ${product.name}${variant ? ' - ' + variant.variant_name : ''}`,
        type: 'flash_sale',
        price: item.price,
        limit_quantity: item.limit_quantity,
        starts_at: schedule.starts_at,
        ends_at: schedule.ends_at,
        status: item.price > 0 ? 'active' : 'inactive',
        schedule,
      });

      await this.pricingRulesRepo.save(newRule);
    }
  }

  return {
    message: 'Cập nhật flash sale thành công',
  };
}

async getActiveFlashSalesForPublic() {
  const now = new Date();
  
  const schedules = await this.scheduleRepo.find({
    where: [
      { status: 'active' },
      { 
        status: 'upcoming',
        starts_at: LessThanOrEqual(new Date(now.getTime() + 2 * 60 * 60 * 1000)) // Sắp diễn ra trong 2h tới
      }
    ],
    order: { starts_at: 'ASC' },
  });

  return { 
    total: schedules.length, 
    data: schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      description: schedule.description,
      starts_at: schedule.starts_at,
      ends_at: schedule.ends_at,
      status: schedule.status,
      // Không trả về thông tin nhạy cảm
    }))
  };
}

async getProductsForPublic(scheduleId: number) {
  // Kiểm tra schedule có tồn tại và active/upcoming không
  const schedule = await this.scheduleRepo.findOne({
    where: { id: scheduleId }
  });
  
  if (!schedule) {
    throw new NotFoundException('Flash sale không tồn tại');
  }

  const rules = await this.pricingRulesRepo.find({
    where: { 
      schedule: { id: scheduleId },
      status: 'active',
      type: 'flash_sale'
    },
    relations: ['product', 'variant', 'product.media', 'product.brand', 'product.store'],
  });

  return rules
    .filter(rule => rule.product && rule.product.store && rule.price != null) // Thêm điều kiện rule.price != null
    .map(rule => {
      const product = rule.product;
      const primaryImage = product.media?.find(media => media.is_primary)?.url 
        || product.media?.[0]?.url 
        || '/placeholder.svg';

      // Tính toán giá gốc: ưu tiên giá từ variant, nếu không có thì từ product
      const originalPrice = rule.variant?.price || product.base_price || 0;
      // Giá flash sale đã được lọc nên rule.price không còn null/undefined
      const salePrice = rule.price!; // Dùng non-null assertion vì đã lọc

      // Tính phần trăm giảm giá
      const discount = originalPrice > salePrice && originalPrice > 0
        ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
        : 0;

      return {
        id: product.id,
        name: product.name,
        image: primaryImage,
        rating: product.avg_rating || 0,
        reviews: product.review_count || 0,
        originalPrice: originalPrice,
        salePrice: salePrice,
        discount: discount,
        badge: 'FLASH SALE',
        brand: product.brand?.name,
        store: {
          id: product.store.id,
          name: product.store.name,
        },
        limit_quantity: rule.limit_quantity,
        remaining_quantity: rule.limit_quantity, // Có thể tính từ orders
      };
    });
}

}
