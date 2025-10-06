import { Injectable } from '@nestjs/common';
import { CreateWalletTransactionDto } from './dto/create-wallet_transaction.dto';
import { UpdateWalletTransactionDto } from './dto/update-wallet_transaction.dto';

@Injectable()
export class WalletTransactionService {
  create(createWalletTransactionDto: CreateWalletTransactionDto) {
    return 'This action adds a new walletTransaction';
  }

  findAll() {
    return `This action returns all walletTransaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} walletTransaction`;
  }

  update(id: number, updateWalletTransactionDto: UpdateWalletTransactionDto) {
    return `This action updates a #${id} walletTransaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} walletTransaction`;
  }
}
