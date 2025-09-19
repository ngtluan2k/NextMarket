import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreRating } from './store-rating.entity';
import { RateStoreDto } from './dto/rate-store.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Store } from '../store/store.entity';
import { In } from 'typeorm';

@Injectable()
export class StoreRatingService {
  constructor(
    @InjectRepository(StoreRating)
    private readonly ratingRepo: Repository<StoreRating>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  // Tạo rating mới
  async createRating(userId: number, storeId: number, dto: RateStoreDto) {
    // Kiểm tra store có tồn tại không
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Kiểm tra user không thể rate store của chính mình
    if (store.user_id === userId) {
      throw new BadRequestException('You cannot rate your own store');
    }

    // Kiểm tra user đã rate store này chưa
    const existingRating = await this.ratingRepo.findOne({
      where: { user_id: userId, store_id: storeId }
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this store');
    }

    const rating = this.ratingRepo.create({
      user_id: userId,
      store_id: storeId,
      ...dto,
    });

    return this.ratingRepo.save(rating);
  }

  // Cập nhật rating
  async updateRating(userId: number, storeId: number, dto: UpdateRatingDto) {
    const rating = await this.ratingRepo.findOne({
      where: { user_id: userId, store_id: storeId }
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Chỉ user tạo rating mới có thể update
    if (rating.user_id !== userId) {
      throw new ForbiddenException('You can only update your own rating');
    }

    Object.assign(rating, dto);
    return this.ratingRepo.save(rating);
  }

  // Xóa rating
  async deleteRating(userId: number, storeId: number) {
    const rating = await this.ratingRepo.findOne({
      where: { user_id: userId, store_id: storeId }
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Chỉ user tạo rating mới có thể xóa
    if (rating.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own rating');
    }

    return this.ratingRepo.remove(rating);
  }

  // Lấy tất cả ratings của store với pagination
  async getStoreRatings(storeId: number, page: number = 1, limit: number = 10) {
    const [ratings, total] = await this.ratingRepo.findAndCount({
      where: { store_id: storeId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy thống kê rating của store
  async getStoreRatingStats(storeId: number) {
    const ratings = await this.ratingRepo.find({
      where: { store_id: storeId }
    });

    if (ratings.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const total = ratings.length;
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    const average = sum / total;
    
    // Tính phân bố rating
    const distribution = ratings.reduce((acc, rating) => {
      acc[rating.stars] = (acc[rating.stars] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Đảm bảo có đủ 1-5 stars
    for (let i = 1; i <= 5; i++) {
      if (!distribution[i]) distribution[i] = 0;
    }

    return {
      average: Math.round(average * 10) / 10, // Làm tròn 1 chữ số thập phân
      total,
      distribution,
    };
  }

  // Lấy rating của user cho store cụ thể
  async getUserRatingForStore(userId: number, storeId: number) {
    return this.ratingRepo.findOne({
      where: { user_id: userId, store_id: storeId },
      relations: ['user', 'store']
    });
  }

  // Lấy tất cả ratings của user
  async getUserRatings(userId: number, page: number = 1, limit: number = 10) {
    const [ratings, total] = await this.ratingRepo.findAndCount({
      where: { user_id: userId },
      relations: ['store'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy top rated stores
  async getTopRatedStores(limit: number = 10) {
    const query = this.ratingRepo
      .createQueryBuilder('rating')
      .select('rating.store_id', 'store_id')
      .addSelect('AVG(rating.stars)', 'average_rating')
      .addSelect('COUNT(rating.id)', 'total_ratings')
      .groupBy('rating.store_id')
      .having('COUNT(rating.id) >= :minRatings', { minRatings: 5 }) // Ít nhất 5 ratings
      .orderBy('average_rating', 'DESC')
      .addOrderBy('total_ratings', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();
    
    // Lấy thông tin stores
    const storeIds = results.map(r => r.store_id);
    
    if (storeIds.length === 0) {
      return [];
    }
    
    const stores = await this.storeRepo.find({
      where: { id: In(storeIds) },
      relations: ['owner']
    });


    // Kết hợp data
    return results.map(result => {
      const store = stores.find(s => s.id === result.store_id);
      return {
        store,
        average_rating: parseFloat(result.average_rating),
        total_ratings: parseInt(result.total_ratings),
      };
    });
  }
}