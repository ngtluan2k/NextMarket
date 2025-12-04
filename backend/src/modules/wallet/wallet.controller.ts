// wallet.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard'; // guard JWT

@Controller('wallets')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyWallet(@Req() req: any) {
    // req.user là payload JWT, giả sử có userId
    const userId = (req.user as any).sub;
    return this.walletService.getMyWallet(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getMyTransactions(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = (req.user as any).sub;
    const skip = (page - 1) * limit;
    
    const wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet) {
      return {
        transactions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const [transactions, total] = await this.walletService.getWalletTransactionsWithPagination(
      userId,
      skip,
      limit,
    );

    return {
      transactions,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }
}
