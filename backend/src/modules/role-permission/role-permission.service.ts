// role-permission.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission) private rpRepo: Repository<RolePermission>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  // Lấy tất cả roles kèm permissions
  async findAllRolesWithCount() {
    const roles = await this.roleRepo.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      permissionCount: role.rolePermissions.length,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        code: rp.permission.code,
        description: rp.permission.description,
      })),
    }));
  }

  // Gán permission cho role
  async assignPermission(roleId: number, permId: number) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    const perm = await this.permRepo.findOne({ where: { id: permId } });
    if (!role || !perm) throw new NotFoundException('Role or Permission not found');

    const exist = await this.rpRepo.findOne({
      where: { role: { id: roleId }, permission: { id: permId } },
    });
    if (exist) throw new BadRequestException('Permission already assigned');

    return this.rpRepo.save(
      this.rpRepo.create({ role, permission: perm, uuid: uuidv4() }),
    );
  }

  // Xóa permission khỏi role
  async removePermission(roleId: number, permId: number) {
    const rp = await this.rpRepo.findOne({
      where: { role: { id: roleId }, permission: { id: permId } },
    });
    if (!rp) throw new NotFoundException('Permission not assigned');
    return this.rpRepo.remove(rp);
  }
}
