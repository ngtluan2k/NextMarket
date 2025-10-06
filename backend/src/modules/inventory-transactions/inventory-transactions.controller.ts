import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoryTransactionsService } from './inventory-transactions.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';

@Controller('inventory-transactions')
export class InventoryTransactionsController {
  constructor(
    private readonly inventoryTransactionsService: InventoryTransactionsService
  ) {}

  @Post()
  create(@Body() createInventoryTransactionDto: CreateInventoryTransactionDto) {
    return this.inventoryTransactionsService.create(
      createInventoryTransactionDto
    );
  }

  @Get()
  findAll() {
    return this.inventoryTransactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryTransactionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryTransactionDto: UpdateInventoryTransactionDto
  ) {
    return this.inventoryTransactionsService.update(
      +id,
      updateInventoryTransactionDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryTransactionsService.remove(+id);
  }
}
