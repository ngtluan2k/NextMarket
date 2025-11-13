import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Req,
  UseGuards,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/order.entity';
import { CustomerFromOrderDto } from './dto/get-order-customer.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('stores/:storeId/orders')
export class StoreOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /stores/:storeId/orders
   * → Lấy danh sách đơn hàng của store, hỗ trợ filter server-side.
   */

  @Get('customers')
  @UseGuards(JwtAuthGuard)
  async getCustomers(@Param('storeId') storeId: string) {
    const storeIdNumber = parseInt(storeId, 10);
    console.log('storeId number:', storeIdNumber);

    const customers = await this.ordersService.getCustomersFromOrders(
      storeIdNumber
    );
    return {
      data: customers,
      total: customers.length,
    };
  }

  @Get('ping')
  ping(@Param('storeId') storeId: string) {
    console.log('ping storeId:', storeId);
    return { storeId };
  }
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getOrderStats(@Param('storeId') storeId: number) {
    console.log('storeId param:', storeId);
    return this.ordersService.getOrderStats(storeId);
  }
  @Get()
  @UseGuards(JwtAuthGuard)
  async findByStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    if (
      !req.user?.roles?.includes('Seller') &&
      !req.user?.roles?.includes('Admin')
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }

    const filters = {
      status: status ? Number(status) : undefined,
      paymentStatus: paymentStatus ? Number(paymentStatus) : undefined,
      fromDate,
      toDate,
      search,
      page,
      limit,
    };

    const data = await this.ordersService.findByStore(storeId, filters);
    const total = await this.ordersService.countOrdersByStore(storeId, filters);

    return { data, total, page, limit };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ): Promise<Order> {
    const order = await this.ordersService.findOne(id);
    if (order.store?.id !== storeId) {
      throw new ForbiddenException('Đơn hàng không thuộc về cửa hàng này');
    }
    return order;
  }

  @Patch(':id/status/:status')
  @UseGuards(JwtAuthGuard)
  async changeStatus(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: string,
    @Body('note') note?: string
  ): Promise<Order> {
    if (
      !req.user?.roles?.includes('Seller') &&
      !req.user?.roles?.includes('Admin')
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }

    const user = { ...req.user, id: req.user.sub };
    const order = await this.ordersService.findOne(id);

    if (order.store?.id !== storeId) {
      throw new ForbiddenException('Đơn hàng không thuộc về cửa hàng này');
    }

    return this.ordersService.changeStatus(id, status, user, note);
  }

  @Get('reports/revenue')
  @UseGuards(JwtAuthGuard)
  async getStoreRevenue(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ): Promise<number> {
    if (
      !req.user?.roles?.includes('Seller') &&
      !req.user?.roles?.includes('Admin')
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }

    return this.ordersService.getStoreRevenue(storeId);
  }

  @Get('reports/stats')
  @UseGuards(JwtAuthGuard)
  async getStoreStats(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ): Promise<{
    totalOrders: number;
    completed: number;
    pending: number;
    totalRevenue: number;
  }> {
    if (
      !req.user?.roles?.includes('Seller') &&
      !req.user?.roles?.includes('Admin')
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }

    return this.ordersService.getStoreStats(storeId);
  }


}
