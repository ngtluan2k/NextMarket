import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class OptimizedUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async loginOptimized(dto: LoginDto) {
    // console.time('[Login] Total Time');
    
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .select([
        'user.id',
        'user.email', 
        'user.username',
        'user.password',
        'user.is_affiliate',
        'userRole.id',
        'role.id',
        'role.name',
        'rolePermission.id', 
        'permission.id',
        'permission.code'
      ])
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    
    if (!isMatch) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const roles = user.roles?.map(ur => ur.role.name) || ['User'];
    const permissions = user.roles?.flatMap(ur => 
      ur.role.rolePermissions?.map(rp => rp.permission.code) || []
    ) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions,
      is_affiliate: user.is_affiliate,
    };
    const token = await this.jwtService.signAsync(payload);
    // console.timeEnd(' [Login] Total Time');

    return {
      status: 200,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_affiliate: user.is_affiliate,
        roles,
        permissions,
      },
      access_token: token,
    };
  }
}
