import { JwtAuthGuard } from './../../common/auth/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    console.log('at server:  ' + JSON.stringify(createOrderDto));
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('view_order')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }

  @Patch(':id/status/:status')
  @UseGuards(JwtAuthGuard)
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: string,
    @Body('note') note: string,
    @Req() req: any
  ) {
    const user = { ...req.user, id: req.user.sub };
    return this.ordersService.changeStatus(id, status, user, note);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.ordersService.findByUser2(userId);
  }

  @Get('reports/revenue')
  getRevenue() {
    return this.ordersService.getRevenue();
  }
  @Get('payment/:paymentUuid')
  async findByPaymentUuid(@Param('paymentUuid') paymentUuid: string) {
    return this.ordersService.findByPaymentUuid(paymentUuid);
  }
  @Get('store/:storeId')
  async getOrdersByStore(@Param('storeId') storeId: number) {
    return this.ordersService.findByStore(storeId);
  }
}
