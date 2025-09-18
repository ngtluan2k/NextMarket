import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';

@ApiBearerAuth('access-token')
@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions('view_role')
  findAll() {
    return this.roleService.findAll();
  }

  @Post()
  @Permissions('add_role')
  create(@Body('name') name: string) {
    return this.roleService.create(name);
  }

  @Patch(':id')
  @Permissions('update_role')
  update(@Param('id') id: number, @Body('name') name: string) {
    return this.roleService.update(id, name);
  }

  @Delete(':id')
  @Permissions('delete_role')
  remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }
}
