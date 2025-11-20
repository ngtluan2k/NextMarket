import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment.entity';
import { Order } from '../../orders/order.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';

@Injectable()
export class MomoStrategy {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>
  ) {}

  async createPayment(
    order: Order,
    paymentMethod: PaymentMethod,
    isGroup: boolean = false
  ) {
    const payment = this.paymentRepo.create({
      order,
      paymentMethod,
      amount: order.totalAmount,
      status: 0,
      isGroup,
    });
    const saved = await this.paymentRepo.save(payment);
    const redirectUrl = `https://test-payment.momo.vn/pay?orderId=${saved.uuid}`;
    
    // ✅ Reload payment with full relations including orderItem.subtotal
    // Use query builder to explicitly select all columns including nullable ones
    const paymentWithOrder = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItem', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('orderItem.variant', 'variant')
      .leftJoinAndSelect('order.group_order', 'group_order')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .addSelect([
        'orderItem.id',
        'orderItem.uuid',
        'orderItem.quantity',
        'orderItem.price',
        'orderItem.discount',
        'orderItem.subtotal', // ✅ Explicitly select subtotal
        'orderItem.note',
      ])
      .where('payment.id = :id', { id: saved.id })
      .getOne();

    return { payment: paymentWithOrder || saved, redirectUrl };
  }

  async handleCallback(payload: any) {
    // TODO: implement Momo payment callback handling (verify signature, update payment status, etc.)
    // Throwing a NotImplementedException ensures the method is non-empty and signals work remaining.
    throw new NotImplementedException(
      'MomoStrategy.handleCallback is not implemented yet'
    );
  }
}
