import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { UserRole } from '../user-role/user-role.entity';
import { StoreLevel } from './../store-level/store-level.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(StoreLevel) private storeLevelRepo: Repository<StoreLevel>,
  ) {}
  
  async findAll() {
    return this.storeRepo.find({
      relations: ['owner'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number) {
    const store = await this.storeRepo.findOne({
      where: { id },
      relations: ['owner']
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async findByUserId(userId: number) {
    return this.storeRepo.findOne({
      where: { user_id: userId },
      relations: ['owner']
    });
  }

  async create(userId: number, dto: CreateStoreDto) {
    const store = this.storeRepo.create({
      ...dto,
      user_id: userId,
      created_at: new Date(),
    });
    return this.storeRepo.save(store);
  }

  // Đăng ký làm seller
  async registerSeller(userId: number, dto: RegisterSellerDto) {
    // 1. Kiểm tra user có tồn tại không
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Kiểm tra user đã có store chưa
    const existingStore = await this.storeRepo.findOne({
      where: { user_id: userId }
    });
    
    if (existingStore) {
      throw new BadRequestException('User already has a store');
    }

    // 3. Tạo slug tự động nếu không được cung cấp
    let slug = dto.slug;
    if (!slug) {
      slug = dto.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Kiểm tra slug có trùng không
      const existingSlug = await this.storeRepo.findOne({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // 4. Tạo store với status inactive (chờ duyệt)
    const store = this.storeRepo.create({
      ...dto,
      slug,
      user_id: userId,
      status: 'inactive', // Chờ duyệt
    });

    const savedStore = await this.storeRepo.save(store);

    // 5. Tạo store level mặc định là 'basic'
    const storeLevel = this.storeLevelRepo.create({
      store_id: savedStore.id,
      level: 'basic',
    });
    await this.storeLevelRepo.save(storeLevel);

    // 6. Gán role "seller" cho user (nếu chưa có)
    const sellerRole = await this.roleRepo.findOne({
      where: { name: 'seller' }
    });

    if (sellerRole) {
      const hasSellerRole = user.roles?.some(ur => ur.role.name === 'seller');
      
      if (!hasSellerRole) {
        const userRole = this.userRoleRepo.create({
          uuid: uuidv4(),
          user: user,
          role: sellerRole,
          assigned_at: new Date(),
        });
        
        await this.userRoleRepo.save(userRole);
      }
    }

    return {
      store: savedStore,
      message: 'Đăng ký làm người bán hàng thành công! Store đang chờ duyệt.'
    };
  }

  // Kiểm tra user có phải seller không
  async isUserSeller(userId: number): Promise<boolean> {
    const store = await this.storeRepo.findOne({
      where: { user_id: userId }
    });
    return !!store;
  }

  // Lấy thống kê store
  async getStoreStats(storeId: number) {
    // Sẽ implement sau khi có các modules khác
    return {
      followers: 0,
      ratings: 0,
      average_rating: 0,
      total_products: 0,
    };
  }

  async update(id: number, dto: UpdateStoreDto) {
    const store = await this.findOne(id);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async remove(id: number) {
    const store = await this.findOne(id);
    return this.storeRepo.remove(store);
  }

  // Duyệt store (Admin only)
  async approveStore(storeId: number) {
    const store = await this.findOne(storeId);
    store.status = 'active';
    return this.storeRepo.save(store);
  }

  // Từ chối store (Admin only)
  async rejectStore(storeId: number) {
    const store = await this.findOne(storeId);
    store.status = 'suspended';
    return this.storeRepo.save(store);
  }
}