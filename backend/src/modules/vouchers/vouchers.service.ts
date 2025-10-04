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

    // Nếu là store owner, bắt buộc phải chỉ định store_id và kiểm tra ownership
    if (role === 'store_owner') {
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
      start_date: new Date(createVoucherDto.start_date),
      end_date: new Date(createVoucherDto.end_date),
      store:
        role === 'Seller'
          ? { id: createVoucherDto.applicable_store_ids![0] }
          : undefined,
    });
    return await this.vouchersRepository.save(voucher);
  }

  async findAll(userId: number, role: string): Promise<Voucher[]> {
    if (role === 'admin') {
      return this.vouchersRepository.find();
    } else if (role === 'store_owner') {
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

    if (role === 'store_owner' && updateVoucherDto.applicable_store_ids) {
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

    // Trạng thái & thời gian hiệu lực
    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher đang ở trạng thái ${voucher.status}`
      );
    }
    if (now < voucher.start_date || now > voucher.end_date) {
      throw new BadRequestException('Voucher không hợp lệ vào thời điểm này');
    }

    // Giới hạn toàn hệ thống
    if (
      voucher.total_usage_limit &&
      voucher.total_used_count >= voucher.total_usage_limit
    ) {
      throw new BadRequestException('Voucher đã đạt giới hạn sử dụng');
    }

    // Giới hạn theo user
    const userUsageCount = await this.voucherUsageRepository.count({
      where: { voucher: { id: voucher.id }, user: { id: userId } },
    });
    if (userUsageCount >= voucher.per_user_limit) {
      throw new BadRequestException(
        'Người dùng đã đạt giới hạn sử dụng voucher'
      );
    }

    // Voucher cho user mới
    if (voucher.new_user_only) {
      const userOrders = await this.ordersRepository.count({
        where: { user: { id: userId } },
      });
      if (userOrders > 0) {
        throw new BadRequestException('Voucher chỉ dành cho người dùng mới');
      }
    }

    // Kiểm tra cửa hàng
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
    // ✅ Nếu cả voucher.store = null và applicable_store_ids rỗng => voucher toàn sàn

    // Tính subtotal
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    if (voucher.min_order_amount && subtotal < voucher.min_order_amount) {
      throw new BadRequestException(
        `Số tiền đơn hàng phải đạt ít nhất ${voucher.min_order_amount}`
      );
    }

    // Kiểm tra sản phẩm áp dụng
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

    // Kiểm tra sản phẩm bị loại trừ
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

    // Tính discount
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
    }

    return { voucher, discount };
  }

  //  Ghi nhận voucher usage
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

    // Check cửa hàng
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
    //Nếu toàn sàn thì bỏ qua

    // Cập nhật usage count
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
      // Kiểm tra giới hạn sử dụng
      if (
        voucher.total_usage_limit &&
        voucher.total_used_count >= voucher.total_usage_limit
      ) {
        continue;
      }

      // Kiểm tra giới hạn mỗi người dùng
      const userUsageCount = await this.voucherUsageRepository.count({
        where: { voucher: { id: voucher.id }, user: { id: userId } },
      });
      if (userUsageCount >= voucher.per_user_limit) {
        continue;
      }

      // Kiểm tra điều kiện người dùng mới
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
    // Lưu thông tin thu thập nếu cần (ví dụ: bảng voucher_collections)
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

  private hasPermission(role: string, permission: string): boolean {
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

    if (role === 'admin') {
      return adminPermissions.includes(permission);
    } else if (role === 'store_owner') {
      return storeOwnerPermissions.includes(permission);
    }
    return false;
  }
}
