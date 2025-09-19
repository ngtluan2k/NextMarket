import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private roleRepo: Repository<Role>) {}

  findAll() {
    return this.roleRepo.find();
  }

  async create(name: string) {
    const exist = await this.roleRepo.findOne({ where: { name } });
    if (exist) throw new BadRequestException('Role already exists');
    const role = this.roleRepo.create({ name });
    return this.roleRepo.save(role);
  }

  async update(id: number, name: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    role.name = name;
    return this.roleRepo.save(role);
  }

  async remove(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return this.roleRepo.remove(role);
  }
}
