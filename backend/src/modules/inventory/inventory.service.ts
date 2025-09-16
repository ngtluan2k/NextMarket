import { Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async addInventory(dto: CreateInventoryDto, userId: number) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId }, relations: ['store'] });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.user_id !== userId) throw new ForbiddenException('You do not own this product');

    const inventory = this.repo.create({
      ...dto,
      product: { id: dto.productId } as Product,
      updated_at: new Date(),
    });

    return this.repo.save(inventory);
  }
}


