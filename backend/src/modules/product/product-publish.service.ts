import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductPublishService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async publish(productId: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'],
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.store.user_id !== userId)
      throw new ForbiddenException('You do not own this product');

    product.status = 'active';
    await this.productRepo.save(product);

    return { message: 'Product published successfully' };
  }
}