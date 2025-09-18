import { Injectable } from '@nestjs/common';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRules } from './pricing-rule.entity';
import { Product } from '../product/product.entity';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class PricingRulesService {
  constructor(
    @InjectRepository(PricingRules)
    private readonly repo: Repository<PricingRules>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>
  ) {}

  async addPricingRule(dto: CreatePricingRuleDto, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.user_id !== userId)
      throw new ForbiddenException('You do not own this product');

    const rule = this.repo.create({
      ...dto,
      product: { id: dto.productId } as Product,
    });

    return this.repo.save(rule);
  }
}
