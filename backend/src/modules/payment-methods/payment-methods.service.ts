// src/payment-methods/payment-methods.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from  './payment-method.entity'
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepo: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto) {
    const method = this.paymentMethodRepo.create(createPaymentMethodDto);
    return await this.paymentMethodRepo.save(method);
  }

  async findAll() {
    return await this.paymentMethodRepo.find();
  }

  async findOne(id: number) {
    const method = await this.paymentMethodRepo.findOneBy({ id });
    if (!method) throw new NotFoundException(`PaymentMethod #${id} not found`);
    return method;
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    const method = await this.findOne(id);
    Object.assign(method, updatePaymentMethodDto);
    return await this.paymentMethodRepo.save(method);
  }

  async remove(id: number) {
    const method = await this.findOne(id);
    return await this.paymentMethodRepo.remove(method);
  }
}
