import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
  Body,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/order.entity';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Controller('users/:userId/orders')
export class UserOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🔹 GET /users/:userId/orders
  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    if (req.user.sub !== userId) {
      throw new ForbiddenException('Bạn không thể xem đơn hàng của người khác');
    }

    const filters = {
      status: status ? Number(status) : undefined,
      page,
      limit,
    };

    const orders = await this.ordersService.findByUser(userId, filters);
    const total = await this.ordersService.countOrdersByUser(userId, filters);
    return { data: orders, total, page, limit };
  }
  @Get('payment/:paymentUuid')
  @UseGuards(JwtAuthGuard)
  async findByPaymentUuid(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('paymentUuid') paymentUuid: string,
    @Req() req: any
  ) {
    if (req.user.sub !== userId) {
      throw new ForbiddenException('Bạn không thể xem đơn hàng của người khác');
    }
    return this.ordersService.findByPaymentUuid(paymentUuid);
  }
  // 🔹 GET /users/:userId/orders/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ): Promise<Order> {
    if (req.user.sub !== userId) {
      throw new ForbiddenException('Bạn không thể xem đơn hàng của người khác');
    }

    return this.ordersService.findOne(id);
  }

  // 🔹 POST /users/:userId/orders — User tự tạo đơn hàng
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any
  ): Promise<Order> {
    if (req.user.sub !== userId) {
      throw new ForbiddenException(
        'Bạn không thể tạo đơn hàng thay người khác'
      );
    }

    // Giống OrdersController: log để debug nếu cần
    console.log(
      'at server (user create order):',
      JSON.stringify(createOrderDto)
    );

    // Gắn userId vào DTO (đảm bảo đơn hàng thuộc user này)
    const orderData = { ...createOrderDto, userId };

    return this.ordersService.create(orderData);
  }

  // 🔹 PATCH /users/:userId/orders/:id/status/:status
  @Patch(':id/status/:status')
  @UseGuards(JwtAuthGuard)
  async changeStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: string,
    @Body('note') note?: string
  ): Promise<Order> {
    if (req.user.sub !== userId) {
      throw new ForbiddenException(
        'Bạn không thể thay đổi đơn hàng của người khác'
      );
    }

    const user = { ...req.user, id: req.user.sub };
    return this.ordersService.changeStatus(id, status, user, note);
  }
}
