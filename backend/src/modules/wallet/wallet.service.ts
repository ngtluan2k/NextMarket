// wallet.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { Repository } from 'typeorm';
import { WalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>
  ) {}

  async getMyWallet(userId: number): Promise<WalletDto> {
    const wallet = await this.walletRepo.findOne({
      where: { user_id: userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      id: wallet.id,
      balance: +wallet.balance,
      currency: wallet.currency,
      updated_at: wallet.updated_at,
    };
  }
}
