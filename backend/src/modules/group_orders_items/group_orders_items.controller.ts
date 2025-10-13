import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { GroupOrderItemsService } from './group_orders_items.service';
import { CreateGroupOrderItemDto } from './dto/create-group-order-item.dto';
import { UpdateGroupOrderItemDto } from './dto/update-group-order-item.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

interface AuthRequest extends Request {
	user: { sub: number; username?: string; email?: string };
}

@Controller('group-orders/:groupId/items')
@UseGuards(JwtAuthGuard)
export class GroupOrderItemsController {
	constructor(private readonly service: GroupOrderItemsService) { }

	@Post()
	create(
		@Param('groupId', ParseIntPipe) groupId: number,
		@Body() dto: CreateGroupOrderItemDto,
		@Req() req: AuthRequest, // ✅ LẤY USER TỪ TOKEN
	) {
		const userId = req.user.sub; // ✅ LẤY USER_ID TỪ TOKEN
		return this.service.addItem(groupId, { ...dto, userId });
	}

	@Get()
	list(@Param('groupId', ParseIntPipe) groupId: number) {
		return this.service.listGroupItems(groupId);
	}

	@Get('/by-member/:memberId')
	listByMember(
		@Param('groupId', ParseIntPipe) groupId: number,
		@Param('memberId', ParseIntPipe) memberId: number,
	) {
		return this.service.listMemberItems(groupId, memberId);
	}

	@Patch(':itemId')
	update(
		@Param('groupId', ParseIntPipe) groupId: number,
		@Param('itemId', ParseIntPipe) itemId: number,
		@Body() dto: UpdateGroupOrderItemDto, 
		@Req() req: AuthRequest,
	) {
		const userId = req.user.sub; 
		return this.service.updateItem(groupId, itemId, dto, userId);
	}

	@Delete(':itemId')
	remove(
		@Param('groupId', ParseIntPipe) groupId: number,
		@Param('itemId', ParseIntPipe) itemId: number,
		@Req() req: AuthRequest,
	) {
		const userId = req.user.sub;
		return this.service.removeItem(groupId, itemId, userId);
	}


}