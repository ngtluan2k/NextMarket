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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { Role } from '../role/role.entity';
import {auth} from '../../types/base'

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionGuard) 
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Permissions('add_inventory')
  @ApiOperation({ summary: 'Add new inventory' })
  @ApiResponse({ status: 201, description: 'Inventory created successfully' })
  async add(@Body() dto: CreateInventoryDto, @Req() req: any) {
    // Debug logging
    console.log('=== ADD INVENTORY DEBUG ===');
    console.log('Full req.user:', JSON.stringify(req.user, null, 2));
    console.log('req.user type:', typeof req.user);
    console.log('req.user keys:', req.user ? Object.keys(req.user) : 'no keys');
    console.log('Headers:', req.headers.authorization);
    
    const userId = req.user?.userId;
    const role = req.user?.role
    if (!userId) {
      console.log('❌ User ID not found');
      auth();
    }
    console.log('✅ User ID found:', userId);
    return this.inventoryService.addInventory(dto, userId, role);
  }

  @Get()
  @Permissions('view_inventory') 
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiResponse({ status: 200, description: 'List of inventories' })
  async findAll(@Req() req: any) {
    // Debug logging
    console.log('=== FIND ALL INVENTORY DEBUG ===');
    console.log('Full req.user:', JSON.stringify(req.user, null, 2));
    console.log('req.user type:', typeof req.user);
    console.log('req.user keys:', req.user ? Object.keys(req.user) : 'no keys');
    console.log('Headers:', req.headers.authorization);
    
    const userId = req.user?.userId;
    if (!userId) {
      console.log('❌ User ID not found');
      // auth()
    }
    console.log('✅ User ID found:', userId);
    return this.inventoryService.findAll(userId);
  }

  @Patch(':id')
  @Permissions('update_inventory') 
  @ApiOperation({ summary: 'Update inventory' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    const role = req.user?.role
    if (!userId) {
      console.log('❌ User ID not found');
      // auth()
    }
    return this.inventoryService.updateInventory(id, dto, userId, role);
  }

  @Delete(':id')
  @Permissions('delete_inventory') 
  @ApiOperation({ summary: 'Delete inventory' })
  @ApiResponse({ status: 200, description: 'Inventory deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {

    
    const userId = req.user?.userId;
    const role = req.user?.role
    if (!userId) {
      auth()
    }
    return this.inventoryService.deleteInventory(id, userId, role);
  }
}