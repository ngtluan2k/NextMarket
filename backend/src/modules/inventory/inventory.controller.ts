import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Req } from '@nestjs/common';
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

@Post()
async add(@Body() dto: CreateInventoryDto, @Req() req: any) {
  const userId = req.user.id;
  return this.inventoryService.addInventory(dto, userId);
}


}
