// role-permission.controller.ts
import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('role-permissions')
@Controller('role-permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolePermissionController {
  constructor(private readonly service: RolePermissionService) {}

  @Get('roles-with-count')
  @Permissions('count_permission_by_role')
  findAllRolesWithCount() {
    return this.service.findAllRolesWithCount();
  }

  @Post('roles/:roleId/permissions/:permId')
  @Permissions('add_permission_to_role')
  assignPermission(@Param('roleId') roleId: number, @Param('permId') permId: number) {
    return this.service.assignPermission(roleId, permId);
  }

  @Delete('roles/:roleId/permissions/:permId')
  @Permissions('delete_permission_from_role')
  removePermission(@Param('roleId') roleId: number, @Param('permId') permId: number) {
    return this.service.removePermission(roleId, permId);
  }
}
