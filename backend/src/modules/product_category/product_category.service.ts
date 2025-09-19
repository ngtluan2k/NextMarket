import { Injectable } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product_category.dto';
import { UpdateProductCategoryDto } from './dto/update-product_category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './product_category.entity';
import { Product } from '../product/product.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repo: Repository<ProductCategory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async addCategory(dto: CreateProductCategoryDto, userId: number) {
  const product = await this.productRepo.findOne({ where: { id: dto.productId }, relations: ['store'] });
  if (!product) throw new NotFoundException('Product not found');
  if (product.store.user_id !== userId) throw new ForbiddenException('You do not own this product');

  const pc = this.repo.create({
    product: { id: dto.productId } as Product,
    category_id: dto.categoryId,
  });

  return this.repo.save(pc);
}

}
