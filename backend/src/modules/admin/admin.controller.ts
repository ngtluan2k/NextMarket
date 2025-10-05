import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // === Role ===
  @Get('roles')
  @Permissions('view_role')
  findAllRoles() {
    return this.adminService.findAllRoles();
  }

  @Post('roles')
  @Permissions('add_role')
  createRole(@Body('name') name: string) {
    return this.adminService.createRole(name);
  }

  @Patch('roles/:id')
  @Permissions('update_role')
  updateRole(@Param('id') id: number, @Body('name') name: string) {
    return this.adminService.updateRole(id, name);
  }

  @Delete('roles/:id')
  @Permissions('delete_role')
  deleteRole(@Param('id') id: number) {
    return this.adminService.deleteRole(id);
  }

  // === Permission ===
  @Get('permissions')
  @Permissions('view_permission')
  findAllPermissions() {
    return this.adminService.findAllPermissions();
  }

  @Post('permissions')
  @Permissions('add_permission')
  createPermission(
    @Body('code') code: string,
    @Body('description') description: string
  ) {
    return this.adminService.createPermission(code, description);
  }

  @Patch('permissions/:id')
  @Permissions('update_permission')
  updatePermission(
    @Param('id') id: number,
    @Body('code') code: string,
    @Body('description') description: string
  ) {
    return this.adminService.updatePermission(id, code, description);
  }

  @Delete('permissions/:id')
  @Permissions('delete_permission')
  deletePermission(@Param('id') id: number) {
    return this.adminService.deletePermission(id);
  }

  // === Role-Permission ===
  @Get('roles-with-permissions')
  @Permissions('count_permission_by_role')
  findAllRolesWithCount() {
    return this.adminService.findAllRolesWithCount();
  }

  @Post('roles/:roleId/permissions/:permId')
  @Permissions('add_permission_to_role')
  assignPermissionToRole(
    @Param('roleId') roleId: number,
    @Param('permId') permId: number
  ) {
    return this.adminService.assignPermissionToRole(roleId, permId);
  }

  @Delete('roles/:roleId/permissions/:permId')
  @Permissions('delete_permission_from_role')
  removePermissionFromRole(
    @Param('roleId') roleId: number,
    @Param('permId') permId: number
  ) {
    return this.adminService.removePermissionFromRole(roleId, permId);
  }

  // === User-Role ===
  @Get('user-roles')
  @Permissions('view_user_role')
  getAllUserRoles() {
    return this.adminService.getAllUserRoles();
  }

  @Post('users/:userId/roles/:roleId')
  @Permissions('assign_role_to_user')
  assignRoleToUser(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number
  ) {
    return this.adminService.assignRoleToUser(userId, roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @Permissions('delete_role_from_user')
  removeRoleFromUser(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number
  ) {
    return this.adminService.removeRoleFromUser(userId, roleId);
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.findAllUsers();
  }
}
