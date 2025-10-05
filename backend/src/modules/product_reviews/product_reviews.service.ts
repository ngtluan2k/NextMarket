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

@Injectable()
export class ProductReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepo: Repository<ProductReview>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>
  ) {}

  async create(
    userId: number,
    dto: CreateProductReviewDto
  ): Promise<ProductReview> {
    const { orderId, productId, rating, comment } = dto;

    // 1. Kiểm tra order có tồn tại và thuộc user
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['orderItem', 'orderItem.product'],
    });
    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hoặc không thuộc về bạn'
      );
    }
    console.log('DEBUG Order status:', order.status);

    if (Number(order.status) !== 5) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành'
      );
    }
    // 2. Kiểm tra product có trong order không
    const hasProduct = order.orderItem.some(
      (item) => item.product.id === productId
    );
    if (!hasProduct) {
      throw new BadRequestException('Sản phẩm này không nằm trong đơn hàng');
    }

    // 3. Kiểm tra trùng review
    const existed = await this.reviewRepo.findOne({
      where: { order: { id: orderId }, product: { id: productId } },
    });
    if (existed) {
      throw new BadRequestException(
        'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi'
      );
    }

    // 4. Tạo review
    const review = this.reviewRepo.create({
      order: { id: orderId } as Order,
      product: { id: productId } as Product,
      user: { id: userId } as User,
      rating,
      comment,
    });

    const savedReview = await this.reviewRepo.save(review);

    // 5. Update rating trung bình và review_count cho product
    await this.updateProductStats(productId);

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });
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
}
