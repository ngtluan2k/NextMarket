// user-role.controller.ts
import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiTags('user-roles')
@Controller('user-roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserRoleController {
  constructor(private readonly service: UserRoleService) {}

  @Get()
  @Permissions('view_user_role')
  getAllUserRoles() {
    return this.service.getAllUserRoles();
  }

  @Post('users/:userId/roles/:roleId')
  @Permissions('assign_role_to_user')
  assignRole(@Param('userId') userId: number, @Param('roleId') roleId: number) {
    return this.service.assignRole(userId, roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @Permissions('delete_role_from_user')
  removeRole(@Param('userId') userId: number, @Param('roleId') roleId: number) {
    return this.service.removeRole(userId, roleId);
  }
}
