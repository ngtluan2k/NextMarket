import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { userId: number; username?: string };
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; quantity?: number; variantId?: number, type?: 'bulk' | 'subscription'| 'normal' |'flash_sale';isGroup?: boolean; }
  ) {
    console.log(
      '{+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++}userId for add cart : ' +
        req.user.userId
    );
    console.log(req);
    return this.cartService.addToCart(
      req.user.userId,
      body.productId,
      body.quantity,
      body.variantId,
      body.type ,
      body.isGroup
    );
  }

  @Get()
  async getCart(@Request() req: AuthRequest) {
    return this.cartService.getCart(req.user.userId);
  }

  @Put('update')
  async updateQuantity(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; quantity: number; variantId?: number; type?: 'bulk' | 'subscription'|'normal' | 'flash_sale';  isGroup?: boolean; }
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      body.productId,
      body.quantity,
      body.variantId,
      body.type,
      body.isGroup
    );
  }

  @Delete('remove/:productId')
  async removeFromCart(
    @Request() req: AuthRequest,
    @Param('productId') productId: number,
    @Body() body?: { variantId?: number; type?: 'bulk' | 'subscription'| 'normal' | 'flash_sale' }
  ) {
    await this.cartService.removeFromCart(
      req.user.userId,
      +productId,
      body?.variantId,
      body?.type
    );
    return { message: 'Đã xóa khỏi giỏ hàng' };
  }

  @Post('clear')
  async clearCart(@Request() req: AuthRequest) {
    await this.cartService.clearCart(req.user.userId);
    return { message: 'Đã xóa toàn bộ sản phẩm trong giỏ hàng!' };
  }
}
