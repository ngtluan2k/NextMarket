import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VoucherUsage } from './voucher_usage.entity';
import { CreateVoucherUsageDto } from './dto/create-voucher-usage.dto';
import { Voucher, VoucherStatus } from '../vouchers/vouchers.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';
import { v4 as uuidv4 } from 'uuid';
import { Store } from '../store/store.entity';

@Injectable()
export class VoucherUsageService {
  constructor(
    @InjectRepository(VoucherUsage)
    private readonly usageRepo: Repository<VoucherUsage>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async create(dto: CreateVoucherUsageDto): Promise<VoucherUsage> {
    // Kiểm tra sự tồn tại của voucher, user, và order
    const voucher = await this.voucherRepo.findOne({
      where: { id: dto.voucher_id },
      relations: ['usages'],
    });
    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher #${dto.voucher_id}`);
    }

    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(`Voucher đang ở trạng thái ${voucher.status}`);
    }

    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng #${dto.user_id}`);
    }

    const order = await this.orderRepo.findOne({ where: { id: dto.order_id } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.order_id}`);
    }

    // Kiểm tra xem voucher đã được sử dụng cho đơn hàng này chưa
    const existingUsage = await this.usageRepo.findOne({
      where: { voucher: { id: dto.voucher_id }, order: { id: dto.order_id } },
    });
    if (existingUsage) {
      throw new BadRequestException('Voucher đã được sử dụng cho đơn hàng này');
    }

    // Kiểm tra giới hạn sử dụng mỗi người dùng
    const userUsageCount = await this.usageRepo.count({
      where: { voucher: { id: dto.voucher_id }, user: { id: dto.user_id } },
    });
    if (userUsageCount >= voucher.per_user_limit) {
      throw new BadRequestException('Người dùng đã đạt giới hạn sử dụng voucher');
    }

    // Tạo bản ghi VoucherUsage
    const usage = this.usageRepo.create({
      ...dto,
      uuid: uuidv4(),
      usedAt: new Date(),
      voucher: { id: dto.voucher_id },
      user: { id: dto.user_id },
      order: { id: dto.order_id },
    });
    return this.usageRepo.save(usage);
  }

  async findAll(userId: number, role: string): Promise<VoucherUsage[]> {
    if (role === 'admin') {
      return this.usageRepo.find({ relations: ['voucher', 'user', 'order', 'order.store'] });
    } else if (role === 'store_owner') {
      // Chỉ lấy VoucherUsage liên quan đến store của user
      const stores = await this.orderRepo.manager.find(Store, { where: { user: { id: userId } } });
      const storeIds = stores.map(store => store.id);
      return this.usageRepo.find({
        where: { order: { store: { id: In (storeIds) } } },
        relations: ['voucher', 'user', 'order', 'order.store'],
      });
    } else {
      // Người dùng thông thường chỉ thấy lịch sử sử dụng của mình
      return this.usageRepo.find({
        where: { user: { id: userId } },
        relations: ['voucher', 'user', 'order', 'order.store'],
      });
    }
  }

  async findOne(id: number, userId: number, role: string): Promise<VoucherUsage> {
    const usage = await this.usageRepo.findOne({
      where: { id },
      relations: ['voucher', 'user', 'order', 'order.store'],
    });
    if (!usage) {
      throw new NotFoundException(`Không tìm thấy bản ghi sử dụng voucher #${id}`);
    }

    if (role !== 'admin') {
      if (role === 'store_owner') {
        const store = await this.orderRepo.manager.findOne(Store, {
          where: { id: usage.order.store.id, user: { id: userId } },
        });
        if (!store) {
          throw new ForbiddenException('Bạn không có quyền xem bản ghi này');
        }
      } else {
        // Người dùng thông thường chỉ thấy bản ghi của mình
        if (usage.user.id !== userId) {
          throw new ForbiddenException('Bạn không có quyền xem bản ghi này');
        }
      }
    }
    return usage;
  }
}