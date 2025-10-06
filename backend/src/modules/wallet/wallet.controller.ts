// wallet.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';// guard JWT

@Controller('wallets')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyWallet(@Req() req: any,) {
    // req.user là payload JWT, giả sử có userId
    const userId = (req.user as any).sub;
    return this.walletService.getMyWallet(userId);
  }
}
