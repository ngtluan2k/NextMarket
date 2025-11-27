import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AffiliateCommission } from '../entity/affiliate-commission.entity';
import { CreateAffiliateCommissionDto } from '../dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from '../dto/update-affiliate-commission.dto';
import { OrderItem } from '../../order-items/order-item.entity';
import { AffiliateLink } from '../../affiliate-links/affiliate-links.entity';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateCommissionsService {
  constructor(
    @InjectRepository(AffiliateCommission)
    private repository: Repository<AffiliateCommission>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>
  ) {}

  async create(
    createDto: CreateAffiliateCommissionDto
  ): Promise<AffiliateCommission> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: createDto.orderItemId },
      relations: ['product'],
    });
    if (!orderItem) {
      throw new NotFoundException(
        `OrderItem with id ${createDto.orderItemId} not found`
      );
    }

    const affiliateLink = await this.affiliateLinkRepository.findOne({
      where: { id: createDto.linkId },
      relations: ['program_id'],
    });
    if (!affiliateLink) {
      throw new NotFoundException(
        `AffiliateLink with id ${createDto.linkId} not found`
      );
    }

    const program = affiliateLink.program_id;
    if (!program) {
      throw new NotFoundException(
        `Affiliate program not found for link id ${createDto.linkId}`
      );
    }

    let amount = createDto.amount;
    if (!amount) {
      const subtotal =
        orderItem.subtotal || orderItem.price - (orderItem.discount || 0);
      amount =
        program.commission_type === 'percentage'
          ? (subtotal * program.commission_value) / 100
          : program.commission_value;
    }

    const entity = new AffiliateCommission();
    entity.uuid = crypto.randomUUID();
    entity.amount = Number(amount.toFixed(2));
    entity.status = createDto.status || 'pending';
    entity.created_at = new Date();
    entity.link_id = { id: createDto.linkId } as any;
    entity.order_item_id = { id: createDto.orderItemId } as any;

    if (createDto.paid_at) {
      entity.paid_at = createDto.paid_at;
    }

    return this.repository.save(entity);
  }

  async findAll(): Promise<AffiliateCommission[]> {
    return this.repository.find({
      relations: ['link_id', 'order_item_id', 'order_item_id.product'],
    });
  }

  async findOne(id: number): Promise<AffiliateCommission> {
    const commission = await this.repository.findOne({
      where: { id },
      relations: ['link_id', 'order_item_id', 'order_item_id.product'],
    });
    if (!commission) {
      throw new NotFoundException(
        `Affiliate commission with id ${id} not found`
      );
    }
    return commission;
  }

  async update(
    id: number,
    updateDto: UpdateAffiliateCommissionDto
  ): Promise<AffiliateCommission> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findReversedByUser(userId: number, page = 1, limit = 20) {
    const [commissions, total] = await this.repository.findAndCount({
      where: {
        beneficiary_user_id: { id: userId } as any,
        status: In(['REVERSED', 'VOIDED']),
      },
      relations: ['order_item_id', 'order_item_id.order', 'order_item_id.product'],
      order: { reversed_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      commissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
