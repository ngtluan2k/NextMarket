// permission.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission) private repo: Repository<Permission>
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(code: string, description: string) {
    const exist = await this.repo.findOne({ where: { code } });
    if (exist) throw new BadRequestException('Permission code already exists');
    return this.repo.save(this.repo.create({ code, description }));
  }

  async update(id: number, code: string, description: string) {
    const perm = await this.repo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    perm.code = code;
    perm.description = description;
    return this.repo.save(perm);
  }

  async remove(id: number) {
    const perm = await this.repo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    return this.repo.remove(perm);
  }
}
