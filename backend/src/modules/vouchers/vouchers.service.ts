import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Voucher } from '../vouchers/vouchers.entity';
import { CreateVoucherDto } from './dto/create-vouchers.dto';
import { UpdateVoucherDto } from './dto/update-vouchers.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private vouchersRepo: Repository<Voucher>
  ) {}

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    // Kiểm tra mã voucher đã tồn tại
    const existingVoucher = await this.vouchersRepo.findOne({
      where: { code: dto.code },
    });

    if (existingVoucher) {
      throw new ConflictException('Mã voucher đã tồn tại');
    }

    // Kiểm tra ngày tháng hợp lệ
    if (new Date(dto.start_date) >= new Date(dto.end_date)) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    // Kiểm tra giá trị giảm giá hợp lệ
    if (dto.discount_type === 'percentage' && dto.discount_value > 100) {
      throw new BadRequestException(
        'Giảm giá phần trăm không thể vượt quá 100%'
      );
    }

    if (dto.discount_value <= 0) {
      throw new BadRequestException('Giá trị giảm giá phải lớn hơn 0');
    }

    const voucher = this.vouchersRepo.create({
      ...dto,
      used_count: 0,
    });

    return this.vouchersRepo.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.vouchersRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Voucher> {
    const voucher = await this.vouchersRepo.findOneBy({ id });
    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
    return voucher;
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.vouchersRepo.findOne({
      where: { code },
      relations: ['usages'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher với mã ${code} không tồn tại`);
    }

    return voucher;
  }

  async findActiveVouchers(): Promise<Voucher[]> {
    const now = new Date();
    return this.vouchersRepo.find({
      where: {
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.vouchersRepo.findOneBy({ id });

    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }

    // Kiểm tra nếu mã voucher được thay đổi và đã tồn tại
    if (dto.code && dto.code !== voucher.code) {
      const existingVoucher = await this.vouchersRepo.findOne({
        where: { code: dto.code },
      });

      if (existingVoucher) {
        throw new ConflictException('Mã voucher đã tồn tại');
      }
    }

    // Kiểm tra ngày tháng hợp lệ
    const startDate = dto.start_date
      ? new Date(dto.start_date)
      : voucher.start_date;
    const endDate = dto.end_date ? new Date(dto.end_date) : voucher.end_date;

    if (startDate >= endDate) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    // Kiểm tra giới hạn lượt dùng
    if (dto.usage_limit !== undefined && voucher.used_count > dto.usage_limit) {
      throw new BadRequestException(
        'Giới hạn lượt dùng không thể nhỏ hơn số lượt đã sử dụng'
      );
    }

    // Kiểm tra giá trị giảm giá hợp lệ
    if (dto.discount_value !== undefined && dto.discount_value <= 0) {
      throw new BadRequestException('Giá trị giảm giá phải lớn hơn 0');
    }

    if (
      dto.discount_type === 'percentage' &&
      dto.discount_value !== undefined &&
      dto.discount_value > 100
    ) {
      throw new BadRequestException(
        'Giảm giá phần trăm không thể vượt quá 100%'
      );
    }

    // Cập nhật voucher
    await this.vouchersRepo.update(id, {
      ...dto,
      uuid: voucher.uuid, // Giữ nguyên UUID
      used_count: voucher.used_count, // Giữ nguyên số lượt đã dùng
    });

    const updatedVoucher = await this.vouchersRepo.findOneBy({ id });
    if (!updatedVoucher) {
      throw new NotFoundException(
        `Voucher với ID ${id} không tồn tại sau khi cập nhật`
      );
    }

    return updatedVoucher;
  }

  async incrementUsage(id: number): Promise<void> {
    const voucher = await this.vouchersRepo.findOneBy({ id });

    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }

    // Kiểm tra nếu voucher đã đạt giới hạn sử dụng
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      throw new BadRequestException('Voucher đã đạt giới hạn sử dụng');
    }

    // Kiểm tra nếu voucher còn hiệu lực
    const now = new Date();
    if (now < voucher.start_date || now > voucher.end_date) {
      throw new BadRequestException('Voucher không trong thời gian hiệu lực');
    }

    await this.vouchersRepo.increment({ id }, 'used_count', 1);
  }

  async validateVoucher(
    code: string,
    orderAmount: number = 0
  ): Promise<{ isValid: boolean; message?: string; voucher?: Voucher }> {
    try {
      const voucher = await this.findByCode(code);
      const now = new Date();

      // Kiểm tra thời gian hiệu lực
      if (now < voucher.start_date) {
        return {
          isValid: false,
          message: 'Voucher chưa đến thời gian sử dụng',
        };
      }

      if (now > voucher.end_date) {
        return { isValid: false, message: 'Voucher đã hết hạn' };
      }

      // Kiểm tra giới hạn sử dụng
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        return { isValid: false, message: 'Voucher đã hết lượt sử dụng' };
      }

      // Kiểm tra giá trị đơn hàng tối thiểu
      if (voucher.min_order_amount && orderAmount < voucher.min_order_amount) {
        return {
          isValid: false,
          message: `Đơn hàng cần tối thiểu ${voucher.min_order_amount.toLocaleString()} VND để sử dụng voucher này`,
        };
      }

      return { isValid: true, voucher };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { isValid: false, message: 'Mã voucher không tồn tại' };
      }
      return { isValid: false, message: 'Lỗi khi xác thực voucher' };
    }
  }

  async remove(id: number): Promise<void> {
    const voucher = await this.vouchersRepo.findOneBy({ id });

    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }

    // Kiểm tra nếu voucher đã được sử dụng
    if (voucher.used_count > 0) {
      throw new BadRequestException('Không thể xóa voucher đã được sử dụng');
    }

    const result = await this.vouchersRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
  }

  async getVoucherStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    fullyUsed: number;
  }> {
    const now = new Date();
    const allVouchers = await this.findAll();

    const active = allVouchers.filter(
      (v) => new Date(v.start_date) <= now && new Date(v.end_date) >= now
    ).length;

    const expired = allVouchers.filter(
      (v) => new Date(v.end_date) < now
    ).length;

    const fullyUsed = allVouchers.filter(
      (v) => v.usage_limit && v.used_count >= v.usage_limit
    ).length;

    return {
      total: allVouchers.length,
      active,
      expired,
      fullyUsed,
    };
  }
}
