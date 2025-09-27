import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment.entity';
import { Order } from '../../orders/order.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';

@Injectable()
export class CodStrategy {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async createPayment(order: Order, paymentMethod: PaymentMethod) {
    const p = this.paymentRepo.create({
      order,
      paymentMethod,
      amount: order.totalAmount,
      status: 0,
    });
    return this.paymentRepo.save(p);
  }

  async handleCallback(payload: any) {
    return null;
  }
}
