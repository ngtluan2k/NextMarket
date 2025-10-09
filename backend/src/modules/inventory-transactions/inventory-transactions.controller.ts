import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryTransactionService } from './inventory-transactions.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';

@ApiTags('inventory-transactions')
@ApiBearerAuth()
@Controller('inventory-transactions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryTransactionController {
  constructor(
    private readonly transactionService: InventoryTransactionService
  ) {}

  @Post()
  @Permissions('add_inventory_transaction')
  @ApiOperation({ summary: 'Tạo giao dịch tồn kho mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async add(@Body() dto: CreateInventoryTransactionDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.transactionService.addInventoryTransaction(dto, userId);
  }

  @Get()
  @Permissions('view_inventory_transaction')
  @ApiOperation({ summary: 'Lấy danh sách giao dịch tồn kho' })
  async findAll() {
    return this.transactionService.findAll();
  }

  @Patch(':id')
  @Permissions('update_inventory_transaction')
  @ApiOperation({ summary: 'Cập nhật giao dịch tồn kho' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryTransactionDto,
    @Req() req: any
  ) {
    const userId = req.user?.userId;
    return this.transactionService.updateInventoryTransaction(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('delete_inventory_transaction')
  @ApiOperation({ summary: 'Xóa giao dịch tồn kho' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.deleteInventoryTransaction(id);
  }
}
