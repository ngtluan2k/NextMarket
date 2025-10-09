import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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
    private readonly voucherUsageService: VoucherUsageService
  ) {}

  async create(
    createVoucherDto: CreateVoucherDto,
    userId: number,
    role: string
  ): Promise<Voucher> {
    if (!this.hasPermission(role, 'add_voucher')) {
      throw new ForbiddenException('Không có quyền tạo voucher');
    }

    if (role === 'seller') {
      if (
        !createVoucherDto.applicable_store_ids ||
        createVoucherDto.applicable_store_ids.length !== 1
      ) {
        throw new BadRequestException(
          'Store owner chỉ có thể tạo voucher cho một store của mình'
        );
      }
      const storeId = createVoucherDto.applicable_store_ids[0];
      await this.checkStoreOwnership(userId, storeId);
    }

    const voucher = this.vouchersRepository.create({
      ...createVoucherDto,
      uuid: uuidv4(),
      start_date: new Date(createVoucherDto.start_date),
      end_date: new Date(createVoucherDto.end_date),
      store:
        role === 'seller'
          ? { id: createVoucherDto.applicable_store_ids![0] }
          : undefined,
    });
    return await this.vouchersRepository.save(voucher);
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

  async findOne(
    id: number,
    userId: number,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    role: string = 'user'
  ): Promise<Voucher> {
    const voucher = await this.vouchersRepository.findOne({
      where: { id },
      relations: ['usages', 'store', 'store.user'],
    });
    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher #${id}`);
    }

    if (role !== 'admin' && role !== 'user') {
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

    if (role === 'seller' && updateVoucherDto.applicable_store_ids) {
      await this.checkStoreOwnership(
        userId,
        updateVoucherDto.applicable_store_ids[0]
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

  async getAvailableVouchers(userId: number): Promise<Voucher[]> {
    const now = new Date();
    const vouchers = await this.vouchersRepository.find({
      where: {
        status: VoucherStatus.ACTIVE,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      relations: ['usages', 'store'],
    });

    const availableVouchers = [];
    for (const voucher of vouchers) {
      if (
        voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit
      ) {
        continue;
      }

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

      availableVouchers.push(voucher);
    }

    return availableVouchers;
  }

  async collectVoucher(voucherId: number, userId: number): Promise<void> {
    const voucher = await this.findOne(voucherId, userId, 'user');

    if (
      voucher.collection_type !== VoucherCollectionType.MANUAL &&
      voucher.collection_type !== VoucherCollectionType.TARGETED
    ) {
      throw new BadRequestException('Voucher này không thể thu thập thủ công');
    }

    if (
      voucher.collection_limit &&
      voucher.collected_count >= voucher.collection_limit
    ) {
      throw new BadRequestException('Voucher đã đạt giới hạn thu thập');
    }

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
    if (!voucherCodes || voucherCodes.length === 0) {
      return { discountTotal: 0, appliedVouchers: [], invalidVouchers: [] };
    }

    const appliedVouchers: {
      code: string;
      discount: number;
      type: VoucherType;
    }[] = [];
    const invalidVouchers: { code: string; error: string }[] = [];
    let discountTotal = 0;

    // Load all vouchers at once to optimize database queries
    const vouchers = await this.vouchersRepository.find({
      where: {
        code: In(voucherCodes.map((code) => code.trim().toUpperCase())),
      },
      relations: ['store'],
    });

    // Validate all vouchers and group by type
    const vouchersByType: {
      [key in VoucherType]?: { voucher: Voucher; discount: number }[];
    } = {};

    for (const code of voucherCodes) {
      try {
        const { voucher, discount } = await this.validateVoucher(
          code,
          userId,
          orderItems,
          storeId
        );

        // Convert discount to number to prevent string concatenation
        const numericDiscount = Number(discount);

        if (!Number.isFinite(numericDiscount)) {
          throw new BadRequestException(
            `Giá trị discount không hợp lệ cho voucher ${code}`
          );
        }

        if (!vouchersByType[voucher.type]) {
          vouchersByType[voucher.type] = [];
        }
        vouchersByType[voucher.type]!.push({
          voucher,
          discount: numericDiscount,
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

    // Process each voucher type
    for (const type of Object.keys(
      vouchersByType
    ) as unknown as VoucherType[]) {
      const vouchersOfType = vouchersByType[type]!;

      // Check for non-stackable vouchers within the same type
      const nonStackableVouchers = vouchersOfType.filter(
        ({ voucher }) => !voucher.stackable
      );
      const stackableVouchers = vouchersOfType.filter(
        ({ voucher }) => voucher.stackable
      );

      if (nonStackableVouchers.length > 0) {
        // If there are non-stackable vouchers, pick the one with the highest discount
        const bestNonStackable = nonStackableVouchers.sort(
          (a, b) => Number(b.discount) - Number(a.discount)
        )[0];

        appliedVouchers.push({
          code: bestNonStackable.voucher.code,
          discount: Number(bestNonStackable.discount),
          type: bestNonStackable.voucher.type,
        });

        // Use Number() to ensure numeric addition
        discountTotal += Number(bestNonStackable.discount);

        // Mark other non-stackable vouchers as invalid
        nonStackableVouchers
          .filter((v) => v.voucher.code !== bestNonStackable.voucher.code)
          .forEach((v) =>
            invalidVouchers.push({
              code: v.voucher.code,
              error: `Không thể áp dụng vì đã chọn voucher ${bestNonStackable.voucher.code} cùng loại`,
            })
          );

        // Mark stackable vouchers of the same type as invalid
        stackableVouchers.forEach((v) =>
          invalidVouchers.push({
            code: v.voucher.code,
            error: `Không thể áp dụng vì đã chọn voucher không kết hợp cùng loại`,
          })
        );
      } else {
        // Apply all stackable vouchers of this type
        stackableVouchers.forEach(({ voucher, discount }) => {
          const numericDiscount = Number(discount);

          appliedVouchers.push({
            code: voucher.code,
            discount: numericDiscount,
            type: voucher.type,
          });

          // Use Number() to ensure numeric addition
          discountTotal += numericDiscount;
        });
      }
    }

    // Verify order amount against total discount
    if (discountTotal > orderAmount) {
      return {
        discountTotal: 0,
        appliedVouchers: [],
        invalidVouchers: [
          {
            code: '',
            error: 'Tổng chiết khấu không thể vượt quá giá trị đơn hàng',
          },
        ],
      };
    }

    // Ensure discountTotal is returned as a number
    return {
      discountTotal: Number(discountTotal),
      appliedVouchers,
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
}
