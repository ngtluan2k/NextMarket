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

  async createPayment(order: Order, paymentMethod: PaymentMethod) {
    const payment = this.paymentRepo.create({
      order,
      paymentMethod,
      amount: order.totalAmount,
      status: 0,
    });
    const saved = await this.paymentRepo.save(payment);
    const redirectUrl = `https://test-payment.momo.vn/pay?orderId=${saved.uuid}`;
    return { payment: saved, redirectUrl };
  }

  async handleCallback(payload: any) {
    // TODO: implement Momo payment callback handling (verify signature, update payment status, etc.)
    // Throwing a NotImplementedException ensures the method is non-empty and signals work remaining.
    throw new NotImplementedException(
      'MomoStrategy.handleCallback is not implemented yet'
    );
  }
}
