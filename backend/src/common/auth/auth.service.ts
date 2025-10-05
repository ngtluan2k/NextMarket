// src/common/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/user/user.entity';
import { UserProfile } from '../../modules/admin/entities/user-profile.entity';
import { Role } from '../../modules/role/role.entity';
import { UserRole } from '../../modules/user-role/user-role.entity';
import { RolePermission } from '../../modules/role-permission/role-permission.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly jwtService: JwtService
  ) {}

  async googleLogin(profile: any) {
    // 🔍 Tìm user theo email + load relations
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
      relations: [
        'profile',
        'roles',
        'roles.role',
        'roles.role.rolePermissions',
        'roles.role.rolePermissions.permission',
      ],
    });

    if (!user) {
      // ❌ Nếu chưa có thì tạo mới
      user = this.userRepository.create({
        email: profile.email,
        password: Math.random().toString(36).slice(-8), // random password
        profile: {
          full_name: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`,
        } as UserProfile,
      });

      await this.userRepository.save(user);

      // ⚡ Gán role mặc định "user"
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'user' },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });

      if (defaultRole) {
        const userRole = this.userRoleRepository.create({
          user,
          role: defaultRole,
          assigned_at: new Date(),
        });
        await this.userRoleRepository.save(userRole);

        // Refresh lại user với role
        user = await this.userRepository.findOne({
          where: { id: user.id },
          relations: [
            'profile',
            'roles',
            'roles.role',
            'roles.role.rolePermissions',
            'roles.role.rolePermissions.permission',
          ],
        });
      }
    }

    if (!user) {
      throw new BadRequestException('Không tạo được user Google');
    }

    // ✅ Lấy roles
    const roles = user.roles?.map((ur) => ur.role.name) || ['user'];

    // ✅ Lấy permissions qua bảng rolePermissions
    const permissions =
      user.roles?.flatMap((ur) =>
        ur.role.rolePermissions?.map((rp) => rp.permission.code)
      ) || [];

    // JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.profile?.full_name || '',
        roles,
        permissions,
      },
    };
  }
}
