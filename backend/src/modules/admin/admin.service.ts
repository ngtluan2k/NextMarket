import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';
import { UserRole } from '../user-role/user-role.entity';
import { User } from '../user/user.entity';
import { RolePermission } from '../role-permission/role-permission.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(UserRole) private urRepo: Repository<UserRole>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RolePermission) private rpRepo: Repository<RolePermission>,
  ) {}

  // ==== Roles ====
  findAllRoles() {
    return this.roleRepo.find({ relations: ['rolePermissions', 'rolePermissions.permission'] });
  }

  async createRole(name: string) {
    const exist = await this.roleRepo.findOne({ where: { name } });
    if (exist) throw new BadRequestException('Role already exists');
    const role = this.roleRepo.create({ name });
    return this.roleRepo.save(role);
  }

  async updateRole(roleId: number, name: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    role.name = name;
    return this.roleRepo.save(role);
  }

  async deleteRole(roleId: number) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    return this.roleRepo.remove(role);
  }

  // ==== Permissions ====
  findAllPermissions() {
    return this.permRepo.find();
  }

  async createPermission(code: string, description: string) {
    const exist = await this.permRepo.findOne({ where: { code } });
    if (exist) throw new BadRequestException('Permission code already exists');
    const perm = this.permRepo.create({ code, description });
    return this.permRepo.save(perm);
  }

  async updatePermission(permId: number, code: string, description: string) {
    const perm = await this.permRepo.findOne({ where: { id: permId } });
    if (!perm) throw new NotFoundException('Permission not found');
    perm.code = code;
    perm.description = description;
    return this.permRepo.save(perm);
  }

  async deletePermission(permId: number) {
    const perm = await this.permRepo.findOne({ where: { id: permId } });
    if (!perm) throw new NotFoundException('Permission not found');
    return this.permRepo.remove(perm);
  }

  // ==== Role-Permission assignment ====
    async findAllRolesWithCount() {
    const roles = await this.roleRepo.find();
    const rolesWithCount = await Promise.all(
      roles.map(async role => {
        const count = await this.rpRepo.count({ where: { role: { id: role.id } } });
        return { ...role, permissionCount: count };
      })
    );
    return rolesWithCount;
  }

  async assignPermissionToRole(roleId: number, permissionId: number) {
  const role = await this.roleRepo.findOne({ where: { id: roleId } });
  const perm = await this.permRepo.findOne({ where: { id: permissionId } });
  if (!role || !perm) throw new NotFoundException('Role or Permission not found');

  const exist = await this.rpRepo.findOne({ where: { role: { id: roleId }, permission: { id: permissionId } } });
  if (exist) throw new BadRequestException('Permission already assigned to role');

  const rp = this.rpRepo.create({ role, permission: perm, uuid: uuidv4() });
  return this.rpRepo.save(rp);
}

  async removePermissionFromRole(roleId: number, permissionId: number) {
    const rp = await this.rpRepo.findOne({ where: { role: { id: roleId }, permission: { id: permissionId } } });
    if (!rp) throw new NotFoundException('Permission not assigned to this role');
    return this.rpRepo.remove(rp);
  }

  // ==== User-Role assignment ====
  async assignRoleToUser(userId: number, roleId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!user || !role) throw new NotFoundException('User or Role not found');

    const exist = await this.urRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
    if (exist) throw new BadRequestException('Role already assigned to user');

    const ur = this.urRepo.create({ user, role, assigned_at: new Date(), uuid: uuidv4() });
    return this.urRepo.save(ur);
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    const ur = await this.urRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
    if (!ur) throw new NotFoundException('Role not assigned to this user');
    return this.urRepo.remove(ur);
  }

  getAllUserRoles() {
    return this.urRepo.find({ relations: ['user', 'role'] });
  }

    findAllUsers() {
    return this.userRepo.find();
  }
}
