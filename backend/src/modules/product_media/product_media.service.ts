import { Injectable } from '@nestjs/common';
import { CreateProductMediaDto } from './dto/create-product_media.dto';
import { UpdateProductMediaDto } from './dto/update-product_media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMedia } from './product_media.entity';
import { Product } from '../product/product.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class ProductMediaService {
  constructor(
    @InjectRepository(ProductMedia)
    private readonly repo: Repository<ProductMedia>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

 async addMedia(dto: CreateProductMediaDto, userId: number) {
  const product = await this.productRepo.findOne({ where: { id: dto.productId }, relations: ['store'] });
  if (!product) throw new NotFoundException('Product not found');
  if (product.store.user_id !== userId) throw new ForbiddenException('You do not own this product');

  const media = this.repo.create({
    ...dto,
    product: { id: dto.productId } as Product,
  });

  return this.repo.save(media);
}
}
