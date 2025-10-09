// backend/src/modules/group_orders/group_orders.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { GroupOrdersService } from './group_orders.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { JoinGroupOrderDto } from './dto/join-group-order.dto';

@Controller('group-orders') //tạo group mới.
export class GroupOrdersController {
  constructor(private readonly service: GroupOrdersService) {}

  @Post()
  create(@Body() dto: CreateGroupOrderDto) {
    return this.service.createGroupOrder(dto);
  }

  @Get(':id') //xem thông tin group.
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getGroupOrderById(id);
  }

  @Post(':id/join') //tham gia group.
  join(@Param('id', ParseIntPipe) id: number, @Body() dto: JoinGroupOrderDto) {
    return this.service.joinGroupOrder(dto.userId, id);
  }

  @Get(':id/orders') //lấy danh sách order của group.
  listOrders(@Param('id', ParseIntPipe) id: number) {
    return this.service.listOrdersInGroup(id);
  }

  @Post('join/:uuid') // link join group
  joinByUuid(@Param('uuid') uuid: string, @Body() dto: JoinGroupOrderDto) {
    return this.service.joinGroupOrderByUuid(dto.userId, uuid);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { name?: string; expiresAt?: string | null }
  ) {
    return this.service.updateGroupOrder(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteGroupOrder(id);
  }

  @Get('uuid/:uuid')
  getByUuid(@Param('uuid') uuid: string) {
    return this.service.getGroupOrderByUuid(uuid);
  }
}
