import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express'; 

interface AuthRequest extends ExpressRequest {
  user: { id: number; username?: string }; // sửa theo payload JWT của bạn
}


@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(@Request() req:AuthRequest, @Body() body: { productId: number; quantity?: number }) {
    return this.cartService.addToCart(req.user.id, body.productId, body.quantity);
  }

  @Get()
  async getCart(@Request() req:AuthRequest) {
    return this.cartService.getCart(req.user.id);
  }

  @Put('update')
  async updateQuantity(@Request() req:AuthRequest, @Body() body: { productId: number; quantity: number }) {
    return this.cartService.updateQuantity(req.user.id, body.productId, body.quantity);
  }

  @Delete('remove/:productId')
  async removeFromCart(@Request() req:AuthRequest, @Param('productId') productId: number) {
    await this.cartService.removeFromCart(req.user.id, +productId);
    return { message: 'Đã xóa khỏi giỏ hàng' };
  }
}