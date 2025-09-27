// user.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../role/role.entity';
import { UserRole } from '../user-role/user-role.entity';
import { UserProfile } from '../admin/entities/user-profile.entity';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
@Injectable()
export class UserService {
  constructor(
     @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role) 
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly jwtService: JwtService, // 👈 inject JwtService
  ) {}

   findAllUsers() {
    return this.userRepository.find();
  }
  
async register(dto: CreateUserDto) {
  // Kiểm tra email và username đã tồn tại
  const exist = await this.userRepository.findOne({ where: [{ email: dto.email }, { username: dto.username }] });
  if (exist) {
    if (exist.email === dto.email) throw new BadRequestException('Email đã tồn tại');
    if (exist.username === dto.username) throw new BadRequestException('Tên đăng nhập đã tồn tại');
  }

  const hashed = await bcrypt.hash(dto.password, 10);

  const user = this.userRepository.create({
    uuid: uuidv4(),
    username: dto.username,
    email: dto.email,
    password: hashed,
    status: 'active',
    created_at: new Date(),
    profile: {
      uuid: uuidv4(),
      full_name: dto.full_name,
      dob: dto.dob,
      phone: dto.phone,
      gender: dto.gender,
      country: dto.country,
      created_at: new Date(),
    },
  });

  let savedUser;
  try {
    savedUser = await this.userRepository.save(user);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('username')) throw new BadRequestException('Tên đăng nhập đã tồn tại');
      if (err.message.includes('email')) throw new BadRequestException('Email đã tồn tại');
    }
    throw err;
  }

  const role = await this.roleRepository.findOne({ where: { name: 'user' } });
  if (!role) throw new BadRequestException('Default role not found');

  const userRole = this.userRoleRepository.create({
    user: savedUser,
    role: role,
  });
  await this.userRoleRepository.save(userRole);

  return savedUser;
}



  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: [
        'roles',
        'roles.role',
        'roles.role.rolePermissions',
        'roles.role.rolePermissions.permission',
      ],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const permissions = user.roles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.code),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
      permissions,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
      permissions,
      token, // 👈 JWT token
    };
  }
  async getProfile(userId: number) {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: number, dto: UpdateUserProfileDto, username?: string) {
  const profile = await this.userProfileRepository.findOne({
    where: { user_id: userId },
    relations: ['user'],
  });
  if (!profile) throw new NotFoundException('Profile not found');

  // Merge dữ liệu profile
  Object.assign(profile, dto);
  await this.userProfileRepository.save(profile);

  // Nếu có username mới -> update bảng users
  if (username && profile.user) {
    profile.user.username = username;
    await this.userRepository.save(profile.user);
  }

  return profile;
}

async updateUsername(userId: number, dto: UpdateUsernameDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.username = dto.username;
    return await this.userRepository.save(user);
  }

}
