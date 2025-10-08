import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard'; // hoặc đường dẫn guard JWT của bạn

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ✅ Người dùng đã đăng nhập mới được phép dùng gói
  @UseGuards(JwtAuthGuard)
  @Post('use')
  async useSubscription(@Req() req: any, @Body() body: any) {
    const user = req.user; // 👈 user lấy từ JWT payload
    const { subscriptionId, usedQuantity, addressId, note } = body;

    return this.subscriptionService.useSubscriptionToCreateOrder(
      user.id,
      subscriptionId,
      usedQuantity ?? 1,
      addressId,
      note,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-subscriptions')
  async getMySubscriptions(@Req() req: any) {
    const userId = req.user.sub;
    return this.subscriptionService.getUserSubscriptions(userId);
  }
}
