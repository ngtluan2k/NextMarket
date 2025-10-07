import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './product_review.entity';
import { Product } from '../product/product.entity';
import { Order } from '../orders/order.entity';
import { CreateProductReviewDto } from './dto/create-product_review.dto';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { ProductReviewMedia } from './product_review_media.entity';
import { Wallet } from '../wallet/wallet.entity';
import { WalletTransaction } from '../wallet_transaction/wallet_transaction.entity';
import * as crypto from 'crypto';

@Injectable()
export class ProductReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepo: Repository<ProductReview>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductReviewMedia)
    private readonly reviewMediaRepo: Repository<ProductReviewMedia>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepo: Repository<WalletTransaction>
  ) {}

  async create(
    userId: number,
    dto: CreateProductReviewDto,
    media?: { url: string; type: 'image' | 'video' }[]
  ): Promise<ProductReview> {
    const { orderId, productId, rating, comment } = dto;

    // ===== Các bước kiểm tra order, product, duplicate như code cũ =====
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['orderItem', 'orderItem.product'],
    });
    if (!order)
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hoặc không thuộc về bạn'
      );
    if (Number(order.status) !== 5)
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành'
      );

    const hasProduct = order.orderItem.some(
      (item) => item.product.id === productId
    );
    if (!hasProduct)
      throw new BadRequestException('Sản phẩm này không nằm trong đơn hàng');

    const existed = await this.reviewRepo.findOne({
      where: { order: { id: orderId }, product: { id: productId } },
    });
    if (existed)
      throw new BadRequestException(
        'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi'
      );

    // ===== Tạo review =====
    const review = this.reviewRepo.create({
      order: { id: orderId } as Order,
      product: { id: productId } as Product,
      user: { id: userId } as User,
      rating,
      comment,
    });

    const savedReview = await this.reviewRepo.save(review);

    // ===== Lưu media nếu có =====
    if (media?.length) {
      const mediaEntities = media.map((m) =>
        this.reviewMediaRepo.create({
          review: savedReview,
          url: m.url,
          type: m.type,
        })
      );
      await this.reviewMediaRepo.save(mediaEntities);
      savedReview.media = mediaEntities;
    }

    // 5. Update rating trung bình và review_count cho product
    await this.updateProductStats(productId);

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
    if (product?.store?.id) {
      await this.updateStoreStats(product.store.id);
    }

    // 7. Thưởng xu cho user vì đã review
    await this.rewardUserForReview(userId, savedReview.id, 100); // thưởng 100 xu
    return savedReview;
  }

  async updateReview(
    userId: number,
    reviewId: number,
    dto: { rating?: number; comment?: string },
    media?: { url: string; type: 'image' | 'video' }[]
  ): Promise<ProductReview> {
    // 1. Lấy review
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'media'],
    });
    if (!review) throw new NotFoundException('Review không tồn tại');
    if (review.user.id !== userId)
      throw new BadRequestException('Bạn không có quyền sửa review này');

    // 2. Cập nhật rating và comment nếu có
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;

    // 3. Cập nhật media nếu có
    if (media) {
      // Xóa media cũ
      if (review.media?.length) {
        await this.reviewMediaRepo.delete({ review: { id: reviewId } });
      }

      // Thêm media mới
      const mediaEntities = media.map((m) =>
        this.reviewMediaRepo.create({ review, url: m.url, type: m.type })
      );
      await this.reviewMediaRepo.save(mediaEntities);
      review.media = mediaEntities;
    }

    // 4. Lưu review
    const savedReview = await this.reviewRepo.save(review);

    // 5. Update rating trung bình cho product
    await this.updateProductStats(review.product.id);

    // 6. Lấy lại product kèm store
    const product = await this.productRepo.findOne({
      where: { id: review.product.id },
      relations: ['store'],
    });

    // 7. Update store stats nếu có
    if (product?.store?.id) {
      await this.updateStoreStats(product.store.id);
    }

    return savedReview;
  }

  private async updateProductStats(productId: number) {
    const { avg, count } = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.product_id = :productId', { productId })
      .getRawOne();

    await this.productRepo.update(productId, {
      avg_rating: avg || 0,
      review_count: parseInt(count, 10) || 0,
    });
  }

  private async updateStoreStats(storeId: number) {
    // Tính trung bình rating của các product có review_count > 0
    const { avg } = await this.productRepo
      .createQueryBuilder('p')
      .select('AVG(p.avg_rating)', 'avg')
      .where('p.store_id = :storeId', { storeId })
      .andWhere('p.review_count > 0') // 👈 chỉ lấy product đã có review
      .getRawOne();

    // Tổng số review = sum(review_count) của tất cả product trong store
    const { total } = await this.productRepo
      .createQueryBuilder('p')
      .select('SUM(p.review_count)', 'total')
      .where('p.store_id = :storeId', { storeId })
      .andWhere('p.review_count > 0')
      .getRawOne();

    await this.storeRepo.update(storeId, {
      avg_rating: avg || 0,
      review_count: total || 0,
    });
  }

  async getReviews(productId: number, page: number, pageSize: number) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { product: { id: productId } },
      relations: ['user', 'user.profile', 'media'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const mapped = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: undefined, // entity hiện tại không có
      body: r.comment,
      images: r.media?.map((m) => m.url) || [],
      author: r.user?.profile
        ? {
            name: r.user.profile.full_name,
            avatarUrl: r.user.profile.avatar_url,
          }
        : undefined,
      variantText: undefined, // chưa có variant
      verifiedPurchase: undefined, // chưa có
      createdAt: r.createdAt,
      helpfulCount: undefined, // chưa có
      commentCount: undefined, // chưa có
    }));

    return { reviews: mapped, total };
  }

  async rewardUserForReview(userId: number, reviewId: number, rewardAmount: number) {
  let wallet = await this.walletRepo.findOne({ where: { user_id: userId } });

  if (!wallet) {
    wallet = this.walletRepo.create({
      uuid: crypto.randomUUID(),
      user_id: userId,
      balance: 0,
      currency: 'VND',
      updated_at: new Date(),
    });
    wallet = await this.walletRepo.save(wallet);
  }

  wallet.balance += rewardAmount;
  wallet.updated_at = new Date();
  await this.walletRepo.save(wallet);

  const transaction = this.walletTransactionRepo.create({
    uuid: crypto.randomUUID(),
    wallet_id: wallet.id,
    type: 'review_reward',
    amount: rewardAmount,
    reference: `review:${reviewId}`,
    created_at: new Date(),
  });
  await this.walletTransactionRepo.save(transaction);
}
}
