// wallet.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletTransaction } from '../wallet_transaction/wallet_transaction.entity';
import { Repository } from 'typeorm';
import { WalletDto } from './dto/wallet.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepo: Repository<WalletTransaction>
  ) {}

  async getMyWallet(userId: number): Promise<WalletDto> {
    // Auto-create wallet if it doesn't exist
    const wallet = await this.createWalletIfNotExists(userId);
    return {
      id: wallet.id,
      balance: +wallet.balance,
      currency: wallet.currency,
      updated_at: wallet.updated_at,
    };
  }

  /**
   * Create wallet for user if it doesn't exist
   */
  async createWalletIfNotExists(userId: number): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        uuid: uuidv4(),
        user_id: userId,
        balance: 0,
        currency: 'VND',
      });
      wallet = await this.walletRepo.save(wallet);
      console.log(`💰 Created new wallet for user ${userId}`);
    }

    return wallet;
  }

  /**
   * Add commission to user's wallet balance
   */
  async addCommissionToWallet(
    userId: number, 
    amount: number, 
    commissionId: string,
    description?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    // Ensure wallet exists
    const wallet = await this.createWalletIfNotExists(userId);

    // Update wallet balance
    wallet.balance = Number(wallet.balance) + Number(amount);
    wallet.updated_at = new Date();
    const updatedWallet = await this.walletRepo.save(wallet);

    // Create transaction record
    const transaction = this.walletTransactionRepo.create({
      uuid: uuidv4(),
      wallet_id: wallet.id,
      wallet: wallet,
      type: 'affiliate_commission',
      amount: Number(amount),
      reference: `commission:${commissionId}`,
      created_at: new Date(),
    });
    const savedTransaction = await this.walletTransactionRepo.save(transaction);

    console.log(`💰 Added ${amount} coins to user ${userId} wallet (Commission: ${commissionId})`);

    return {
      wallet: updatedWallet,
      transaction: savedTransaction,
    };
  }

  /**
   * Get wallet by user ID
   */
  async getWalletByUserId(userId: number): Promise<Wallet | null> {
    return await this.walletRepo.findOne({
      where: { user_id: userId },
    });
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(userId: number, limit: number = 20): Promise<WalletTransaction[]> {
    const wallet = await this.walletRepo.findOne({
      where: { user_id: userId },
    });

    if (!wallet) return [];

    return await this.walletTransactionRepo.find({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get wallet transaction history with pagination
   */
  async getWalletTransactionsWithPagination(
    userId: number,
    skip: number = 0,
    limit: number = 20,
  ): Promise<[WalletTransaction[], number]> {
    const wallet = await this.walletRepo.findOne({
      where: { user_id: userId },
    });

    if (!wallet) return [[], 0];

    return await this.walletTransactionRepo.findAndCount({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
  }

  async deductCommissionFromWallet(
    userId: number, 
    amount: number, 
    commissionId: string, 
    reason: string,
    manager?: any  // ✅ Thêm optional EntityManager parameter
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    
    // ✅ Dùng manager nếu có, không thì dùng repo
    const walletRepo = manager ? manager.getRepository(Wallet) : this.walletRepo;
    const txRepo = manager ? manager.getRepository(WalletTransaction) : this.walletTransactionRepo;
    
    // Tìm hoặc tạo wallet
    let wallet = await walletRepo.findOne({ where: { user_id: userId } });
    
    if (!wallet) {
      wallet = walletRepo.create({
        uuid: uuidv4(),
        user_id: userId,
        balance: 0,
        currency: 'VND',
      });
      wallet = await walletRepo.save(wallet);
    }
    
    // Check balance
    if (Number(wallet.balance) < Number(amount)) {
      throw new Error(`Insufficient balance for userid: ${userId}. Required: ${amount}, Available: ${wallet.balance}`);
    }

    // Update balance
    wallet.balance = Number(wallet.balance) - Number(amount);
    wallet.updated_at = new Date();

    // ✅ Save với repo (có thể là manager hoặc this.walletRepo)
    const updatedWallet = await walletRepo.save(wallet);

    // Create transaction record
    const transaction = txRepo.create({
      uuid: uuidv4(),
      wallet_id: wallet.id,
      wallet: wallet,
      type: 'Hủy hoa hồng',
      amount: -Number(amount),
      reference: `commission_reversal: ${commissionId}`,
      description: reason,
      created_at: new Date(),
    });
    
    // ✅ Save với repo
    const savedTransaction = await txRepo.save(transaction);

    console.log(
      `💸 Deducted ${amount} coins from user ${userId} wallet (Commission reversal: ${commissionId}, Reason: ${reason})`
    );

    return {
      wallet: updatedWallet,
      transaction: savedTransaction,
    };
  }
}
