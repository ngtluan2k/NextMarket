import { Injectable } from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './variant.entity';
import { Product } from '../product/product.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(Variant)
    private readonly repo: Repository<Variant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async addVariant(dto: CreateVariantDto, userId: number) {
  const product = await this.productRepo.findOne({ where: { id: dto.productId }, relations: ['store'] });
  if (!product) throw new NotFoundException('Product not found');
  if (product.store.user_id !== userId) throw new ForbiddenException('You do not own this product');

  const variant = this.repo.create({
    ...dto,
    product: { id: dto.productId } as Product,
  });

  return this.repo.save(variant);
}

}

