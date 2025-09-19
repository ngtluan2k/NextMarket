// user-role.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './user-role.entity';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole) private urRepo: Repository<UserRole>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  
  getAllUserRoles() {
    return this.urRepo.find({ relations: ['user', 'role'] });
  }

  async assignRole(userId: number, roleId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!user || !role) throw new NotFoundException('User or Role not found');

    const exist = await this.urRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
    if (exist) throw new BadRequestException('Role already assigned');

    return this.urRepo.save(this.urRepo.create({ user, role, assigned_at: new Date(), uuid: uuidv4() }));
  }

  async removeRole(userId: number, roleId: number) {
    const ur = await this.urRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
    if (!ur) throw new NotFoundException('Role not assigned');
    return this.urRepo.remove(ur);
  }
}
