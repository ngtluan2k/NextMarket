// permission.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Get()
  @Permissions('view_permission')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Permissions('add_permission')
  create(@Body('code') code: string, @Body('description') description: string) {
    return this.service.create(code, description);
  }

  @Patch(':id')
  @Permissions('update_permission')
  update(@Param('id') id: number, @Body('code') code: string, @Body('description') description: string) {
    return this.service.update(id, code, description);
  }

  @Delete(':id')
  @Permissions('delete_permission')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
