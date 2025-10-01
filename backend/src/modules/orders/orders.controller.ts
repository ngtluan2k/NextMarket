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
import { OrderStatuses } from './order.entity';
import { UseGuards } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    console.log('at server:  ' + JSON.stringify(createOrderDto));
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
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
    @Param('status') status: keyof typeof OrderStatuses,
    @Body('note') note: string,
    @Req() req: any // hoặc @User() nếu bạn có decorator lấy user từ JWT
  ) {
    const user = { ...req.user, id: req.user.sub };
    return this.ordersService.changeStatus(
      id,
      OrderStatuses[status],
      user,
      note
    );
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.ordersService.findByUser(userId);
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
