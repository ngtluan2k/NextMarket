import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,         
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from './user_address.entity';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';
import { GhnMappingService } from '../../services/ghn-mapping.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,
    private readonly ghnMappingService: GhnMappingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // === PRIVATE: Đảm bảo mọi địa chỉ đều có mã GHN ===
  private async ensureGhnMapping(address: UserAddress): Promise<void> {
    // Nếu đã có đủ mã GHN → bỏ qua
    if (address.ghn_district_id && address.ghn_ward_code) {
      return;
    }

    // Nếu thiếu tỉnh hoặc huyện → không thể map
    if (!address.province || !address.district) {
      console.warn('Không thể map GHN: thiếu tỉnh/huyện', {
        province: address.province,
        district: address.district,
      });
      return;
    }

    try {
      const ghnIds = await this.ghnMappingService.mapToGHNIds(
        address.province.trim(),
        address.district.trim(),
        address.ward?.trim(),
      );

      if (ghnIds.ghn_district_id && ghnIds.ghn_ward_code) {
        address.ghn_province_id = ghnIds.ghn_province_id;
        address.ghn_district_id = ghnIds.ghn_district_id;
        address.ghn_ward_code = ghnIds.ghn_ward_code;

        console.log('Map GHN thành công:', {
          text: `${address.ward || ''}, ${address.district}, ${address.province}`.trim(),
          districtId: ghnIds.ghn_district_id,
          wardCode: ghnIds.ghn_ward_code,
        });
      } else {
        console.warn('Map GHN thất bại (không tìm thấy district/ward)', {
          province: address.province,
          district: address.district,
          ward: address.ward,
        });
      }
    } catch (error) {
      console.error('Lỗi khi map GHN IDs:', error instanceof Error ? error.message : error);
      // Không throw → vẫn cho tạo địa chỉ
    }
  }

  // === CREATE ===
  async create(
    createUserAddressDto: CreateUserAddressDto & { userId: number },
  ): Promise<UserAddress> {
    // Xử lý địa chỉ mặc định
    if (createUserAddressDto.isDefault) {
      await this.userAddressRepository.update(
        { user: { id: createUserAddressDto.userId } },
        { isDefault: false },
      );
    }

    const address = this.userAddressRepository.create({
      ...createUserAddressDto,
      user: { id: createUserAddressDto.userId } as any,
    });

    // BẮT BUỘC map GHN ngay khi tạo
    await this.ensureGhnMapping(address);

    const savedAddress = await this.userAddressRepository.save(address);

    // Xóa cache
    await this.clearAddressCache(createUserAddressDto.userId);

    return savedAddress;
  }

  // === FIND ALL ===
  async findAllByUserId(userId: number): Promise<UserAddress[]> {
    const cacheKey = `user-addresses:${userId}`;
    const cached = await this.cacheManager.get<UserAddress[]>(cacheKey);

    if (cached) return cached;

    const addresses = await this.userAddressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, addresses, 300000); // 5 phút
    return addresses;
  }

  // === FIND ONE (và tự động map nếu thiếu) ===
  async findOne(id: number, userId: number): Promise<UserAddress> {
    const address = await this.userAddressRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException(`Địa chỉ với ID ${id} không tồn tại`);
    }

    // Tự động map lại nếu thiếu GHN info
    await this.ensureGhnMapping(address);

    if (
      (!address.ghn_district_id || !address.ghn_ward_code) &&
      address.province &&
      address.district
    ) {
      await this.userAddressRepository.save(address);
      await this.clearAddressCache(userId);
    }

    return address;
  }

  // === UPDATE ===
  async update(
    id: number,
    userId: number,
    updateUserAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    const address = await this.findOne(id, userId);

    // Xử lý địa chỉ mặc định
    if (updateUserAddressDto.isDefault) {
      await this.userAddressRepository.update(
        { user: { id: userId } },
        { isDefault: false },
      );
    }

    // Cập nhật thông tin
    Object.assign(address, updateUserAddressDto);

    // Nếu thay đổi địa chỉ → map lại GHN
    const addressChanged =
      updateUserAddressDto.province !== undefined ||
      updateUserAddressDto.district !== undefined ||
      updateUserAddressDto.ward !== undefined;

    if (addressChanged) {
      await this.ensureGhnMapping(address);
    }

    const updatedAddress = await this.userAddressRepository.save(address);
    await this.clearAddressCache(userId);

    return updatedAddress;
  }

  // === DELETE ===
  async remove(id: number, userId: number): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.userAddressRepository.remove(address);
    await this.clearAddressCache(userId);
  }

  // === API: Lấy địa chỉ + đảm bảo có GHN info ===
  async getAddressWithGHNInfo(id: number, userId: number): Promise<UserAddress> {
    const address = await this.findOne(id, userId);

    if (!address.ghn_district_id || !address.ghn_ward_code) {
      throw new BadRequestException(
        'Địa chỉ này chưa được hỗ trợ giao hàng bởi GHN. Vui lòng chọn địa chỉ khác.',
      );
    }

    return address;
  }

  // === ADMIN: Cập nhật lại GHN cho 1 địa chỉ ===
  async updateGHNInfo(id: number, userId: number): Promise<UserAddress> {
    const address = await this.findOne(id, userId);

    if (!address.province || !address.district) {
      throw new BadRequestException('Địa chỉ thiếu tỉnh/huyện, không thể cập nhật GHN');
    }

    await this.ensureGhnMapping(address);
    const updated = await this.userAddressRepository.save(address);
    await this.clearAddressCache(userId);

    return updated;
  }

  // === ADMIN: Cập nhật lại tất cả địa chỉ của user ===
  async updateAllGHNInfoForUser(userId: number): Promise<{ updated: number; failed: number }> {
    const addresses = await this.userAddressRepository.find({
      where: { user: { id: userId } },
    });

    let updated = 0;
    let failed = 0;

    for (const addr of addresses) {
      if (addr.province && addr.district) {
        try {
          await this.ensureGhnMapping(addr);
          await this.userAddressRepository.save(addr);
          updated++;
        } catch {
          failed++;
        }
      } else {
        failed++;
      }
    }

    await this.clearAddressCache(userId);
    return { updated, failed };
  }

  // === PRIVATE: Xóa cache ===
  private async clearAddressCache(userId: number): Promise<void> {
    await this.cacheManager.del(`user-addresses:${userId}`);
  }
  public async getAllUserIdsWithAddresses(): Promise<number[]> {
  const result = await this.userAddressRepository
    .createQueryBuilder('ua')
    .select('DISTINCT ua.user_id', 'userId')
    .where('ua.user_id IS NOT NULL')
    .getRawMany();

  return result.map(r => r.userId);
}
}