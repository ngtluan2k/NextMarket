import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Brackets,
} from 'typeorm';
import {
  Voucher,
  VoucherStatus,
  VoucherType,
  VoucherDiscountType,
  VoucherCollectionType,
} from './vouchers.entity';
import { CreateVoucherDto } from './dto/create-vouchers.dto';
import { UpdateVoucherDto } from './dto/update-vouchers.dto';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';
import { Store } from '../store/store.entity';
import { VoucherUsageService } from '../voucher-usage/voucher-usage.service';
import { CreateVoucherUsageDto } from '../voucher-usage/dto/create-voucher-usage.dto';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { VoucherCollection } from '../voucher-collection/voucher-collection.entity';

export interface ExtendedVoucher extends Voucher {
  user_used_count: number;
  is_collected: boolean;
}

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly vouchersRepository: Repository<Voucher>,
    @InjectRepository(VoucherUsage)
    private readonly voucherUsageRepository: Repository<VoucherUsage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    private readonly voucherUsageService: VoucherUsageService,
    @InjectRepository(VoucherCollection)
    private readonly voucherCollectionRepository: Repository<VoucherCollection>
  ) {}

  async create(
    createVoucherDto: CreateVoucherDto,
    userId: number,
    role: string | string[]
  ): Promise<Voucher> {
    console.log('=== VOUCHER CREATE START ===');
    console.log('Role:', role);
    console.log('User ID:', userId);
    console.log('DTO received:', createVoucherDto);

    const roleArray = Array.isArray(role) ? role : [role];
    console.log('Role array:', roleArray);

    // Kiểm tra quyền
    if (!this.hasPermission(roleArray, 'add_voucher')) {
      throw new ForbiddenException('Không có quyền tạo voucher');
    }

    let storeId: number | undefined;

    // Xác định xem có phải Seller thuần túy không (không phải Admin)
    const isSellerOnly =
      roleArray.includes('Seller') && !roleArray.includes('Admin');

    if (isSellerOnly) {
      console.log('Processing for Seller only role');

      if (createVoucherDto.store) {
        storeId = createVoucherDto.store;
        console.log('Using store from DTO.store:', storeId);
      } else if (
        createVoucherDto.applicable_store_ids &&
        createVoucherDto.applicable_store_ids.length === 1
      ) {
        storeId = createVoucherDto.applicable_store_ids[0];
        console.log('Using store from applicable_store_ids:', storeId);
      }

      if (!storeId) {
        throw new BadRequestException(
          'Store owner phải cung cấp store hoặc applicable_store_ids với một store duy nhất'
        );
      }

      console.log('Checking store ownership...');
      await this.checkStoreOwnership(userId, storeId);
      console.log('Store ownership check passed');
    } else {
      // Admin hoặc Admin + Seller
      storeId = undefined;
      console.log('User is Admin or Admin+Seller, storeId can be null');
    }

    // Kiểm tra discount logic
    if (
      createVoucherDto.discount_type === VoucherDiscountType.FIXED &&
      (createVoucherDto.min_order_amount ?? 0) <
        (createVoucherDto.discount_value ?? 0)
    ) {
      throw new BadRequestException(
        'Đơn hàng tối thiểu phải lớn hơn hoặc bằng giá trị giảm'
      );
    }

    // Tách store ra khỏi DTO
    const { store, ...voucherData } = createVoucherDto;
    console.log('Voucher data after removing store:', voucherData);
    console.log(
      'Store relation to set:',
      storeId ? { id: storeId } : undefined
    );

    // Tạo entity voucher
    const voucher = this.vouchersRepository.create({
      ...voucherData,
      uuid: uuidv4(),
      start_date: new Date(createVoucherDto.start_date),
      end_date: new Date(createVoucherDto.end_date),
      store: storeId ? { id: storeId } : undefined,
    });

    console.log('Voucher entity created:', voucher);

    try {
      const savedVoucher = await this.vouchersRepository.save(voucher);
      console.log('Voucher saved successfully:', savedVoucher);
      console.log('Saved voucher store relation:', savedVoucher.store);
      return savedVoucher;
    } catch (error) {
      console.error('Error saving voucher:', error);
      throw error;
    }
  }

  async findAll(userId: number, roles: string[] | string): Promise<Voucher[]> {
    const roleList = Array.isArray(roles) ? roles : [roles];

    if (roleList.includes('Admin')) {
      return this.vouchersRepository.find();
    } else if (roleList.includes('Seller')) {
      const ownedStores = await this.storesRepository.find({
        where: { user: { id: userId } },
      });
      const storeIds = ownedStores.map((store) => store.id);
      return this.vouchersRepository.find({
        where: { store: { id: In(storeIds) } },
      });
    }
    throw new ForbiddenException('Không có quyền xem danh sách voucher');
  }

  async findOne(id: number, userId: number, role = 'user'): Promise<Voucher> {
    const voucher = await this.vouchersRepository.findOne({
      where: { id },
      relations: ['usages', 'store', 'store.user'],
    });
    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher #${id}`);
    }

    if (role !== 'Admin' && role !== 'user') {
      await this.checkVoucherOwnership(userId, voucher);
    }
    return voucher;
  }

  async update(
    id: number,
    updateVoucherDto: UpdateVoucherDto,
    userId: number,
    role: string
  ): Promise<Voucher> {
    const voucher = await this.findOne(id, userId, role);
    if (!this.hasPermission(role, 'update_voucher')) {
      throw new ForbiddenException('Không có quyền cập nhật voucher');
    }

    if (role === 'Seller' && updateVoucherDto.applicable_store_ids) {
      await this.checkStoreOwnership(
        userId,
        updateVoucherDto.applicable_store_ids[0]
      );
    }

    if (
      updateVoucherDto.discount_type === VoucherDiscountType.FIXED &&
      updateVoucherDto.min_order_amount !== undefined &&
      updateVoucherDto.discount_value !== undefined &&
      updateVoucherDto.min_order_amount < updateVoucherDto.discount_value
    ) {
      throw new BadRequestException(
        'Đơn hàng tối thiểu phải lớn hơn hoặc bằng giá trị giảm (min_order_amount >= discount_value)'
      );
    }

    Object.assign(voucher, updateVoucherDto);
    return await this.vouchersRepository.save(voucher);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const voucher = await this.findOne(id, userId, role);
    if (!this.hasPermission(role, 'delete_voucher')) {
      throw new ForbiddenException('Không có quyền xóa voucher');
    }
    await this.vouchersRepository.remove(voucher);
  }

  async validateVoucher(
    voucherCode: string,
    userId: number,
    orderItems: { productId: number; quantity: number; price: number }[],
    storeId: number
  ): Promise<{ voucher: Voucher; discount: number }> {
    const normalizedCode = voucherCode.trim().toUpperCase();

    const voucher = await this.vouchersRepository.findOne({
      where: { code: normalizedCode },
      relations: ['store'],
    });

    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy mã voucher ${voucherCode}`);
    }

    const now = new Date();

    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher đang ở trạng thái ${voucher.status}`
      );
    }
    if (now < voucher.start_date || now > voucher.end_date) {
      throw new BadRequestException('Voucher không hợp lệ vào thời điểm này');
    }

    if (
      voucher.total_usage_limit &&
      voucher.total_used_count >= voucher.total_usage_limit
    ) {
      throw new BadRequestException('Voucher đã đạt giới hạn sử dụng');
    }

    const userUsageCount = await this.voucherUsageRepository.count({
      where: { voucher: { id: voucher.id }, user: { id: userId } },
    });
    if (userUsageCount >= voucher.per_user_limit) {
      throw new BadRequestException(
        'Người dùng đã đạt giới hạn sử dụng voucher'
      );
    }

    if (voucher.new_user_only) {
      const userOrders = await this.ordersRepository.count({
        where: { user: { id: userId } },
      });
      if (userOrders > 0) {
        throw new BadRequestException('Voucher chỉ dành cho người dùng mới');
      }
    }

    const applicableStores = voucher.applicable_store_ids || [];
    if (voucher.store?.id) {
      if (voucher.store.id !== storeId) {
        throw new BadRequestException('Voucher không áp dụng cho cửa hàng này');
      }
    } else if (applicableStores.length > 0) {
      if (!applicableStores.includes(storeId)) {
        throw new BadRequestException('Voucher không áp dụng cho cửa hàng này');
      }
    }
    const applicableUsers = voucher.applicable_user_ids || [];
    if (applicableUsers.length > 0 && !applicableUsers.includes(userId)) {
      throw new BadRequestException('Voucher không áp dụng cho người dùng này');
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    if (voucher.min_order_amount && subtotal < voucher.min_order_amount) {
      throw new BadRequestException(
        `Số tiền đơn hàng phải đạt ít nhất ${voucher.min_order_amount}`
      );
    }

    if (
      voucher.applicable_product_ids?.length &&
      !orderItems.some((item) =>
        voucher.applicable_product_ids!.includes(item.productId)
      )
    ) {
      throw new BadRequestException(
        'Voucher không áp dụng cho các sản phẩm này'
      );
    }

    if (
      voucher.excluded_product_ids?.length &&
      orderItems.some((item) =>
        voucher.excluded_product_ids!.includes(item.productId)
      )
    ) {
      throw new BadRequestException(
        'Voucher không thể áp dụng cho sản phẩm bị loại trừ'
      );
    }

    let discount = 0;
    if (voucher.discount_type === VoucherDiscountType.PERCENTAGE) {
      discount = (subtotal * voucher.discount_value) / 100;
      if (
        voucher.max_discount_amount &&
        discount > voucher.max_discount_amount
      ) {
        discount = voucher.max_discount_amount;
      }
    } else if (voucher.discount_type === VoucherDiscountType.FIXED) {
      discount = voucher.discount_value;
    } else if (voucher.discount_type === VoucherDiscountType.CASH_BACK) {
      discount = voucher.discount_value;
    }

    return { voucher, discount };
  }

  async applyVoucher(
    voucherId: number,
    userId: number,
    order: Order,
    manager?: EntityManager
  ): Promise<VoucherUsage> {
    const voucher = await this.vouchersRepository.findOne({
      where: { id: voucherId },
      relations: ['store'],
    });

    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher #${voucherId}`);
    }

    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher đang ở trạng thái ${voucher.status}`
      );
    }

    const applicableStores = voucher.applicable_store_ids || [];
    if (voucher.store?.id) {
      if (order.store && voucher.store.id !== order.store.id) {
        throw new BadRequestException(
          'Voucher này không áp dụng cho store này'
        );
      }
    } else if (applicableStores.length > 0) {
      if (!order.store || !applicableStores.includes(order.store.id)) {
        throw new BadRequestException('Voucher không áp dụng cho cửa hàng này');
      }
    }

    voucher.total_used_count += 1;
    if (
      voucher.total_usage_limit &&
      voucher.total_used_count >= voucher.total_usage_limit
    ) {
      voucher.status = VoucherStatus.DEPLETED;
    }

    if (manager) {
      await manager.save(voucher);
      const usage = manager.create(VoucherUsage, {
        voucher: { id: voucherId },
        user: { id: userId },
        order: { id: order.id },
        usedAt: new Date(),
      });
      return manager.save(usage);
    }

    await this.vouchersRepository.save(voucher);
    return this.voucherUsageService.create({
      voucher_id: voucherId,
      user_id: userId,
      order_id: order.id,
    });
  }

  async getAvailableVouchers(
    userId?: number,
    storeId?: number,
    filterByStoreOnly = false
  ): Promise<Voucher[]> {
    if (userId) {
    await this.autoCollectVouchersForUser(userId);  
  }
    const now = new Date();

    const queryBuilder = this.vouchersRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.store', 'store')
      .where('voucher.status = :status', { status: VoucherStatus.ACTIVE })
      .andWhere('voucher.start_date <= :now', { now })
      .andWhere('voucher.end_date >= :now', { now });

    // ✅ THÊM: Filter voucher theo collection_type
    // Chỉ hiển thị AUTO vouchers cho tất cả
    // MANUAL/TARGETED chỉ hiển thị nếu user nằm trong applicable_user_ids
    if (userId) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // Voucher AUTO - hiển thị cho tất cả
          qb.where('voucher.collection_type = :autoType', {
            autoType: VoucherCollectionType.AUTO,
          });

          // Voucher MANUAL/TARGETED - chỉ hiển thị cho user được chỉ định
          qb.orWhere(
            new Brackets((subQb) => {
              subQb
                .where('voucher.collection_type IN (:...manualTypes)', {
                  manualTypes: [
                    VoucherCollectionType.MANUAL,
                    VoucherCollectionType.TARGETED,
                  ],
                })
                .andWhere(
                  new Brackets((innerQb) => {
                    innerQb
                      .where(
                        'voucher.applicable_user_ids IS NULL OR JSON_LENGTH(voucher.applicable_user_ids) = 0'
                      ) // Nếu empty, hiển thị tất
                      .orWhere(
                        'JSON_SEARCH(voucher.applicable_user_ids, "one", :userId) IS NOT NULL',
                        { userId: userId.toString() }
                      );
                  })
                );
            })
          );

          // Voucher EVENT - hiển thị cho tất cả (nếu muốn)
          qb.orWhere('voucher.collection_type = :eventType', {
            eventType: VoucherCollectionType.EVENT,
          });
        })
      );
    } else {
      // Nếu không có userId, chỉ hiển thị AUTO và EVENT
      queryBuilder.andWhere('voucher.collection_type IN (:...types)', {
        types: [VoucherCollectionType.AUTO, VoucherCollectionType.EVENT],
      });
    }

    // Store filtering logic (giữ nguyên code cũ)
    if (storeId && storeId !== 0 && filterByStoreOnly) {
      queryBuilder
        .andWhere(
          new Brackets((qb) => {
            qb.where('voucher.store_id = :storeId', { storeId });
            if (storeId) {
              qb.orWhere(
                'JSON_SEARCH(voucher.applicable_store_ids, "one", :storeId) IS NOT NULL',
                { storeId: storeId.toString() }
              );
            }
          })
        )
        .andWhere('voucher.store_id IS NOT NULL');
    } else if (storeId && storeId !== 0 && !filterByStoreOnly) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('voucher.store_id IS NULL');
          qb.orWhere('voucher.store_id = :storeId', { storeId });
          if (storeId) {
            qb.orWhere(
              'JSON_SEARCH(voucher.applicable_store_ids, "one", :storeId) IS NOT NULL',
              { storeId: storeId.toString() }
            );
          }
        })
      );
    }

    const vouchers = await queryBuilder
      .orderBy('voucher.priority', 'DESC')
      .addOrderBy('voucher.created_at', 'DESC')
      .getMany();

    console.log(
      `📦 Found ${vouchers.length} vouchers after collection_type filtering`
    );

    // Rest of the logic (usage limits, etc.) - giữ nguyên
    const availableVouchers = [];
    for (const voucher of vouchers) {
      if (
        voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit
      ) {
        continue;
      }

      if (
        voucher.collection_limit &&
        voucher.collected_count >= voucher.collection_limit
      ) {
        continue;
      }

      if (userId) {
        const userUsageCount = await this.voucherUsageRepository.count({
          where: { voucher: { id: voucher.id }, user: { id: userId } },
        });
        if (userUsageCount >= voucher.per_user_limit) {
          continue;
        }

        if (voucher.new_user_only) {
          const userOrders = await this.ordersRepository.count({
            where: { user: { id: userId } },
          });
          if (userOrders > 0) {
            continue;
          }
        }
      }

      availableVouchers.push(voucher);
    }

    console.log(`✅ Returning ${availableVouchers.length} available vouchers`);
    return availableVouchers;
  }
  async getAvailableVouchersForAnyStore(): Promise<Voucher[]> {
    const now = new Date();

    const vouchers = await this.vouchersRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.store', 'store')
      .where('voucher.status = :status', { status: VoucherStatus.ACTIVE })
      .andWhere('voucher.start_date <= :now', { now })
      .andWhere('voucher.end_date >= :now', { now })
      .orderBy('voucher.priority', 'DESC')
      .addOrderBy('voucher.created_at', 'DESC')
      .getMany();

    console.log(
      `✅ Found ${vouchers.length} vouchers (filtered only by status/date)`
    );

    return vouchers;
  }

  async collectVoucher(voucherId: number, userId: number): Promise<void> {
    const voucher = await this.findOne(voucherId, userId, 'user');

    if (
      voucher.collection_type !== VoucherCollectionType.MANUAL &&
      voucher.collection_type !== VoucherCollectionType.TARGETED &&
      voucher.collection_type !== VoucherCollectionType.EVENT
    ) {
      throw new BadRequestException('Voucher này không thể thu thập thủ công');
    }

    if (
      voucher.collection_limit &&
      voucher.collected_count >= voucher.collection_limit
    ) {
      throw new BadRequestException('Voucher đã đạt giới hạn thu thập');
    }

    // Kiểm tra applicable_user_ids
    console.log(
      `Attempting to collect voucher ${voucherId} for user ${userId}`
    );
    console.log(
      `Voucher applicable_user_ids: ${JSON.stringify(
        voucher.applicable_user_ids
      )}`
    );
    if (
      voucher.applicable_user_ids?.length &&
      voucher.applicable_user_ids.length > 0 &&
      !voucher.applicable_user_ids?.includes(userId)
    ) {
      throw new BadRequestException(
        'Bạn không nằm trong danh sách được phép thu thập voucher này'
      );
    }

    // Kiểm tra đã thu thập chưa
    const existing = await this.voucherCollectionRepository.findOne({
      where: { voucher: { id: voucherId }, user: { id: userId } },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã thu thập voucher này rồi');
    }

    // Tạo bản ghi thu thập
    const collection = this.voucherCollectionRepository.create({
      voucher: { id: voucherId },
      user: { id: userId },
    });
    await this.voucherCollectionRepository.save(collection);

    voucher.collected_count += 1;
    await this.vouchersRepository.save(voucher);
  }

  async calculateDiscount(
    voucherCodes: string[],
    userId: number,
    orderItems: { productId: number; quantity: number; price: number }[],
    storeId: number,
    orderAmount: number
  ): Promise<{
    discountTotal: number;
    appliedVouchers: { code: string; discount: number; type: VoucherType }[];
    invalidVouchers: { code: string; error: string }[];
  }> {
    console.log(' Tính toán giảm giá được gọi với:', {
      voucherCodes,
      userId,
      orderItems,
      storeId,
      orderAmount,
    });

    if (!voucherCodes || voucherCodes.length === 0) {
      return { discountTotal: 0, appliedVouchers: [], invalidVouchers: [] };
    }

    const appliedVouchers: {
      code: string;
      discount: number;
      type: VoucherType;
      store_id?: number;
      stackable: boolean;
    }[] = [];

    const invalidVouchers: { code: string; error: string }[] = [];
    let discountTotal = 0;

    const calculatedSubtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    console.log('💰 Số tiền đơn hàng:', {
      từFrontend: orderAmount,
      tínhToán: calculatedSubtotal,
      chênhLệch: orderAmount - calculatedSubtotal,
    });

    const effectiveOrderAmount = calculatedSubtotal;

    //  SỬA: Nhóm voucher theo type VÀ store_id cho type STORE
    const vouchersByGroup: {
      [key: string]: { voucher: Voucher; discount: number }[];
    } = {};

    for (const code of voucherCodes) {
      try {
        const { voucher, discount } = await this.validateVoucher(
          code,
          userId,
          orderItems,
          storeId
        );

        const numericDiscount = Number(discount);

        if (!Number.isFinite(numericDiscount)) {
          throw new BadRequestException(
            `Giá trị discount không hợp lệ cho voucher ${code}`
          );
        }

        // TẠO KEY NHÓM: Với STORE type, nhóm theo store_id, với các type khác nhóm theo type
        let groupKey: string;
        if (voucher.type === VoucherType.STORE) {
          groupKey = `store_${voucher.store?.id || 'platform'}`;
        } else {
          groupKey = `type_${voucher.type}`;
        }

        if (!vouchersByGroup[groupKey]) {
          vouchersByGroup[groupKey] = [];
        }

        const cappedDiscount = Math.min(numericDiscount, effectiveOrderAmount);
        vouchersByGroup[groupKey].push({
          voucher,
          discount: cappedDiscount,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : 'Voucher không hợp lệ';

        invalidVouchers.push({
          code,
          error: message,
        });
      }
    }

    //  SỬA: Xử lý từng nhóm
    for (const groupKey of Object.keys(vouchersByGroup)) {
      const vouchersInGroup = vouchersByGroup[groupKey]!;

      const nonStackableVouchers = vouchersInGroup.filter(
        ({ voucher }) => !voucher.stackable
      );
      const stackableVouchers = vouchersInGroup.filter(
        ({ voucher }) => voucher.stackable
      );

      //  FIX: Xử lý non-stackable trước
      if (nonStackableVouchers.length > 0) {
        // Chọn voucher non-stackable có discount cao nhất
        const bestNonStackable = nonStackableVouchers.sort(
          (a, b) => Number(b.discount) - Number(a.discount)
        )[0];

        appliedVouchers.push({
          code: bestNonStackable.voucher.code,
          discount: Number(bestNonStackable.discount),
          type: bestNonStackable.voucher.type,
          store_id: bestNonStackable.voucher.store?.id,
          stackable: bestNonStackable.voucher.stackable,
        });

        discountTotal += Number(bestNonStackable.discount);

        // Đánh dấu các voucher non-stackable khác trong cùng nhóm là invalid
        nonStackableVouchers
          .filter((v) => v.voucher.code !== bestNonStackable.voucher.code)
          .forEach((v) =>
            invalidVouchers.push({
              code: v.voucher.code,
              error: `Không thể áp dụng vì đã chọn voucher ${
                bestNonStackable.voucher.code
              } cùng ${groupKey.startsWith('store_') ? 'cửa hàng' : 'loại'}`,
            })
          );

        //  QUAN TRỌNG: Nếu có non-stackable, KHÔNG cho phép stackable trong cùng nhóm
        stackableVouchers.forEach((v) =>
          invalidVouchers.push({
            code: v.voucher.code,
            error: `Không thể áp dụng vì đã chọn voucher không kết hợp cùng ${
              groupKey.startsWith('store_') ? 'cửa hàng' : 'loại'
            }`,
          })
        );
      } else {
        //  Chỉ áp dụng stackable nếu không có non-stackable
        stackableVouchers.forEach(({ voucher, discount }) => {
          const numericDiscount = Number(discount);

          appliedVouchers.push({
            code: voucher.code,
            discount: numericDiscount,
            type: voucher.type,
            store_id: voucher.store?.id,
            stackable: voucher.stackable,
          });

          discountTotal += numericDiscount;
        });
      }
    }

    if (discountTotal > effectiveOrderAmount) {
      // Tính tỷ lệ giảm cho từng voucher
      const ratio = effectiveOrderAmount / discountTotal;
      appliedVouchers.forEach((voucher) => {
        voucher.discount = Math.floor(voucher.discount * ratio);
      });

      discountTotal = effectiveOrderAmount;
    }

    discountTotal = Math.max(0, discountTotal);

    return {
      discountTotal: Number(discountTotal),
      appliedVouchers: appliedVouchers.map((v) => ({
        code: v.code,
        discount: v.discount,
        type: v.type,
      })),
      invalidVouchers,
    };
  }

  private async checkStoreOwnership(
    userId: number,
    storeId: number
  ): Promise<void> {
    const store = await this.storesRepository.findOne({
      where: { id: storeId, user: { id: userId } },
    });
    if (!store) {
      throw new ForbiddenException('Bạn không sở hữu store này');
    }
  }

  private async checkVoucherOwnership(
    userId: number,
    voucher: Voucher
  ): Promise<void> {
    if (voucher.store && voucher.store.user.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập voucher này');
    }
  }

  private hasPermission(roles: string[] | string, permission: string): boolean {
    const adminPermissions = [
      'add_voucher',
      'view_voucher',
      'update_voucher',
      'delete_voucher',
    ];
    const storeOwnerPermissions = [
      'add_voucher',
      'view_voucher',
      'update_voucher',
      'delete_voucher',
    ];

    const roleList = Array.isArray(roles) ? roles : [roles];

    if (roleList.includes('Admin')) {
      return adminPermissions.includes(permission);
    } else if (roleList.includes('Seller')) {
      return storeOwnerPermissions.includes(permission);
    }
    return false;
  }
  private isVoucherActive(voucher: Voucher): boolean {
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);

    return (
      voucher.status === VoucherStatus.ACTIVE &&
      now >= startDate &&
      now <= endDate &&
      (!voucher.total_usage_limit ||
        voucher.total_used_count < voucher.total_usage_limit)
    );
  }

  private isVoucherExpired(voucher: Voucher): boolean {
    const now = new Date();
    const endDate = new Date(voucher.end_date);
    return now > endDate || voucher.status === VoucherStatus.EXPIRED;
  }

  private isVoucherDepleted(voucher: Voucher): boolean {
    return (
      voucher.status === VoucherStatus.DEPLETED ||
      (!!voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit)
    );
  }
async autoCollectVouchersForUser(userId: number): Promise<void> {
    console.log(`Tự động thu thập voucher AUTO cho user ${userId}`);

    const now = new Date();

    // Lấy tất cả voucher AUTO đang active
    const autoVouchers = await this.vouchersRepository.find({
      where: {
        collection_type: VoucherCollectionType.AUTO,
        status: VoucherStatus.ACTIVE,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
        store: IsNull(),
      },
    });

    console.log(`📦 Tìm thấy ${autoVouchers.length} voucher AUTO`);

    for (const voucher of autoVouchers) {
      try {
        // Kiểm tra đã thu thập chưa
        const existing = await this.voucherCollectionRepository.findOne({
          where: {
            voucher: { id: voucher.id },
            user: { id: userId },
          },
        });

        if (existing) {
          console.log(` User đã có voucher ${voucher.code}`);
          continue;
        }

        // Kiểm tra giới hạn thu thập
        if (
          voucher.collection_limit &&
          voucher.collected_count >= voucher.collection_limit
        ) {
          console.log(` Voucher ${voucher.code} đã đạt giới hạn thu thập`);
          continue;
        }

        // Kiểm tra applicable_user_ids (nếu có)
        if (
          voucher.applicable_user_ids?.length &&
          !voucher.applicable_user_ids.includes(userId)
        ) {
          console.log(
            ` User ${userId} không nằm trong danh sách cho voucher ${voucher.code}`
          );
          continue;
        }

        // Kiểm tra new_user_only
        if (voucher.new_user_only) {
          const userOrdersCount = await this.ordersRepository.count({
            where: { user: { id: userId } },
          });
          if (userOrdersCount > 0) {
            console.log(` User ${userId} không phải user mới`);
            continue;
          }
        }

        // Tạo bản ghi thu thập
        const collection = this.voucherCollectionRepository.create({
          voucher: { id: voucher.id },
          user: { id: userId },
        });
        await this.voucherCollectionRepository.save(collection);

        // Tăng collected_count
        voucher.collected_count += 1;
        await this.vouchersRepository.save(voucher);

        console.log(
          `Tự động thu thập voucher ${voucher.code} cho user ${userId}`
        );
      } catch (error) {
        console.error(`Lỗi khi tự động thu thập voucher ${voucher.id}:`, error);
      }
    }
  }
  async getUserCollectedVouchers(userId: number): Promise<ExtendedVoucher[]> {
    console.log(`📦 Lấy voucher ĐÃ THU THẬP cho người dùng ${userId}`);
    await this.autoCollectVouchersForUser(userId);
    // 1. Lấy tất cả voucher mà user đã thu thập
    const userCollections = await this.voucherCollectionRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher', 'voucher.store'],
    });

    console.log(`📦 User đã thu thập ${userCollections.length} voucher`);

    // 2. Lấy thông tin sử dụng
    const userVoucherUsages = await this.voucherUsageRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher'],
    });

    const userUsageMap = new Map<number, number>();
    userVoucherUsages.forEach((usage) => {
      const vid = usage.voucher.id;
      userUsageMap.set(vid, (userUsageMap.get(vid) || 0) + 1);
    });

    // 3. Xử lý từng voucher đã thu thập
    const collectedVouchers: ExtendedVoucher[] = [];

    for (const collection of userCollections) {
      const voucher = collection.voucher;

      // Thêm voucher với metadata
      collectedVouchers.push({
        ...voucher,
        user_used_count: userUsageMap.get(voucher.id) || 0,
        is_collected: true, // Luôn là true vì user đã thu thập
      });
    }

    // 4. Sắp xếp
    return collectedVouchers.sort((a, b) => {
      // Ưu tiên: chưa sử dụng > đã sử dụng một phần
      const aUsed = a.user_used_count > 0;
      const bUsed = b.user_used_count > 0;

      if (!aUsed && bUsed) return -1;
      if (aUsed && !bUsed) return 1;

      // Sắp xếp theo end_date
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    });
  }

  async getAvailableVouchersForCollection(
    userId: number
  ): Promise<ExtendedVoucher[]> {
    console.log(`📦 Lấy voucher CÓ THỂ THU THẬP cho người dùng ${userId}`);
    await this.autoCollectVouchersForUser(userId);

    
    // 1. Lấy TẤT CẢ voucher nền tảng active
    const now = new Date();
    const allPlatformVouchers = await this.vouchersRepository.find({
      where: {
        store: IsNull(), // Chỉ voucher nền tảng
        status: VoucherStatus.ACTIVE,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      relations: ['store'],
    });

    // 2. Lấy voucher user đã thu thập
    const userCollections = await this.voucherCollectionRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher'],
    });
    const collectedVoucherIds = new Set(
      userCollections.map((c) => c.voucher.id)
    );

    // 3. Lấy thông tin sử dụng
    const userVoucherUsages = await this.voucherUsageRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher'],
    });

    const userUsageMap = new Map<number, number>();
    userVoucherUsages.forEach((usage) => {
      const vid = usage.voucher.id;
      userUsageMap.set(vid, (userUsageMap.get(vid) || 0) + 1);
    });

    // 4. Xử lý từng voucher - CHỈ LẤY VOUCHER CHƯA THU THẬP
    const availableVouchers: ExtendedVoucher[] = [];

    for (const voucher of allPlatformVouchers) {
      // Bỏ qua nếu user đã thu thập voucher này
      if (collectedVoucherIds.has(voucher.id)) {
        continue;
      }

      // Kiểm tra giới hạn tổng
      if (
        voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit
      )
        continue;

      // Kiểm tra giới hạn thu thập
      if (
        voucher.collection_limit &&
        voucher.collected_count >= voucher.collection_limit
      )
        continue;

      const userUsageCount = userUsageMap.get(voucher.id) || 0;

      // Kiểm tra giới hạn per user
      if (userUsageCount >= voucher.per_user_limit) continue;

      // Kiểm tra new user only
      if (voucher.new_user_only) {
        const userOrdersCount = await this.ordersRepository.count({
          where: { user: { id: userId } },
        });
        if (userOrdersCount > 0) continue;
      }

      // Kiểm tra applicable_user_ids
      if (
        voucher.applicable_user_ids?.length &&
        !voucher.applicable_user_ids.includes(userId)
      )
        continue;

      // Thêm voucher với metadata
      availableVouchers.push({
        ...voucher,
        user_used_count: userUsageCount,
        is_collected: false, // Luôn là false vì user chưa thu thập
      });
    }

    // 5. Sắp xếp
    return availableVouchers.sort((a, b) => {
      // Sắp xếp theo end_date (sắp hết hạn lên trước)
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    });
  }

  // Giữ nguyên method getUserVouchers cũ (nếu cần cho tương thích)
  async getUserVouchers(userId: number): Promise<ExtendedVoucher[]> {
    console.log(`📦 Lấy TẤT CẢ voucher nền tảng cho người dùng ${userId}`);
    await this.autoCollectVouchersForUser(userId);

    // 1 Lấy TẤT CẢ voucher nền tảng active
    const now = new Date();
    const allPlatformVouchers = await this.vouchersRepository.find({
      where: {
        store: IsNull(), // Chỉ voucher nền tảng
        status: VoucherStatus.ACTIVE,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      relations: ['store'],
    });

    // 2 Lấy thông tin thu thập
    const userCollections = await this.voucherCollectionRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher'],
    });
    const collectedVoucherIds = new Set(
      userCollections.map((c) => c.voucher.id)
    );

    // 3 Lấy thông tin sử dụng
    const userVoucherUsages = await this.voucherUsageRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher'],
    });

    const userUsageMap = new Map<number, number>();
    userVoucherUsages.forEach((usage) => {
      const vid = usage.voucher.id;
      userUsageMap.set(vid, (userUsageMap.get(vid) || 0) + 1);
    });

    // 4 Xử lý từng voucher
    const availableVouchers: ExtendedVoucher[] = [];

    for (const voucher of allPlatformVouchers) {
      // Kiểm tra giới hạn tổng
      if (
        voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit
      )
        continue;

      // Kiểm tra giới hạn thu thập
      if (
        voucher.collection_limit &&
        voucher.collected_count >= voucher.collection_limit
      )
        continue;

      const userUsageCount = userUsageMap.get(voucher.id) || 0;

      // Kiểm tra giới hạn per user
      if (userUsageCount >= voucher.per_user_limit) continue;

      // Kiểm tra new user only
      if (voucher.new_user_only) {
        const userOrdersCount = await this.ordersRepository.count({
          where: { user: { id: userId } },
        });
        if (userOrdersCount > 0) continue;
      }

      // Kiểm tra applicable_user_ids
      if (
        voucher.applicable_user_ids?.length &&
        !voucher.applicable_user_ids.includes(userId)
      )
        continue;

      // Thêm voucher với metadata
      availableVouchers.push({
        ...voucher,
        user_used_count: userUsageCount,
        is_collected: collectedVoucherIds.has(voucher.id),
      });
    }

    // 5 Sắp xếp
    return availableVouchers.sort((a, b) => {
      // Ưu tiên: chưa sử dụng > đã sử dụng một phần
      const aUsed = a.user_used_count > 0;
      const bUsed = b.user_used_count > 0;

      if (!aUsed && bUsed) return -1;
      if (aUsed && !bUsed) return 1;

      // Sắp xếp theo end_date
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    });
  }
}