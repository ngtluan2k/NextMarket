import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { GroupOrdersService } from './group_orders.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { JoinGroupOrderDto } from './dto/join-group-order.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CheckoutGroupOrderDto } from './dto/checkout-group-order.dto';
import { BadRequestException } from '@nestjs/common';
import { OrderStatuses } from '../orders/types/orders';


@Controller('group-orders') //tạo group mới.
export class GroupOrdersController {
  constructor(private readonly service: GroupOrdersService) { }

  @Post()
  create(@Body() dto: CreateGroupOrderDto) {
    return this.service.createGroupOrder(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.userId;
    return this.service.getGroupOrderById(id, userId);
  }


  @Post(':id/join') //tham gia group.
  join(@Param('id', ParseIntPipe) id: number, @Body() dto: JoinGroupOrderDto) {
    return this.service.joinGroupOrder(dto.userId, id, dto.joinCode);
  }

  @Get('code/:code')
  getByJoinCode(@Param('code') code: string) {
    return this.service.getGroupOrderByJoinCode(code);
  }

  @Post('join-code/:code')
  joinByCode(@Param('code') code: string, @Body() dto: JoinGroupOrderDto) {
    return this.service.joinGroupOrderByJoinCode(code, dto.userId);
  }

  @Get(':id/orders') //lấy danh sách order của group.
  listOrders(@Param('id', ParseIntPipe) id: number) {
    return this.service.listOrdersInGroup(id);
  }

  @Post('join/:uuid') // link join group
  joinByUuid(@Param('uuid') uuid: string, @Body() dto: JoinGroupOrderDto) {
    return this.service.joinGroupOrderByUuid(dto.userId, uuid);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req: any
  ) {
    const userId = req.user.userId; // hoặc req.user.sub
    return this.service.updateGroupOrder(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.userId; // hoặc req.user.sub
    return this.service.deleteGroupOrder(id, userId);
  }
  @Get('uuid/:uuid')
  getByUuid(@Param('uuid') uuid: string) {
    return this.service.getGroupOrderByUuid(uuid);
  }

  @Get('user/:userId/active')
  getUserActiveGroups(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getUserActiveGroupOrders(userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':id/checkout')
  async checkoutGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckoutGroupOrderDto,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.checkoutGroupOrder(
      id,
      userId,
      body.paymentMethodUuid,
      body.addressId,
      body.voucherCode
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/me/address')
  async updateMyAddress(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() body: { addressId: number },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.updateMemberAddress(groupId, userId, body.addressId);
  }

  @Get(':id/with-orders')
  @UseGuards(JwtAuthGuard)
  async getGroupWithOrders(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const result = await this.service.getGroupOrderWithAllOrders(id);

    return {
      message: 'Group order with all member orders',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/order-status/:status')
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status', ParseIntPipe) status: OrderStatuses,
    @Req() req: any,
  ) {
    if (status < 0 || status > 7) {
      throw new BadRequestException('Invalid order status. Must be 0-7');
    }
    const userId = req.user.userId;
    return this.service.updateOrderStatus(id, status, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/order-status/:status/bulk')
  async updateOrderStatusBulk(
    @Param('id', ParseIntPipe) id: number,
    @Param('status', ParseIntPipe) status: OrderStatuses,
    @Req() req: any,
  ) {
    if (status < 0 || status > 7) {
      throw new BadRequestException('Invalid order status. Must be 0-7');
    }
    const userId = req.user.userId;
    return this.service.updateOrderStatusWithOrders(id, status, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.leaveGroupOrder(id, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':id/checkout-my-items')
  async checkoutMyItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { paymentMethodUuid: string; addressId?: number; voucherCode?: string; },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.checkoutMemberItems(
      id,
      userId,
      body.paymentMethodUuid,
      body.addressId,
      body.voucherCode
    );
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/lock')
  async lockGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.manualLockGroup(id, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/unlock')
  async unlockGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.service.unlockGroupOrder(id, userId);
  }
}

