// user.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../role/role.entity';
import { UserRole } from '../user-role/user-role.entity';
import { UserProfile } from '../admin/entities/user-profile.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { VerifyRegisterOtpDto } from './dto/register-otp.dto';
import { MailService } from '../../common/mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';

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
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  // In-memory OTP store
  private otpStore = new Map<
    string,
    { code: string; expiresAt: number; attempts: number }
  >();
  private otpTtlMs = 10 * 60 * 1000; // 10 phút
  private otpMaxAttempts = 5;

  findAllUsers() {
    return this.userRepository.find();
  }

  async register(dto: CreateUserDto) {
    // Kiểm tra email và username đã tồn tại
    const exist = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exist) {
      if (exist.email === dto.email)
        throw new BadRequestException('Email đã tồn tại');
      if (exist.username === dto.username)
        throw new BadRequestException('Tên đăng nhập đã tồn tại');
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

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('username'))
          throw new BadRequestException('Tên đăng nhập đã tồn tại');
        if (err.message.includes('email'))
          throw new BadRequestException('Email đã tồn tại');
      }
      throw err;
    }

    const role = await this.roleRepository.findOne({
      where: { name: 'Customer' },
    });
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

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = user.roles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.code)
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
      access_token: token, // đồng nhất FE
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

  async updateProfile(
    userId: number,
    dto: UpdateUserProfileDto,
    username?: string
  ) {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Profile not found');

    Object.assign(profile, dto);
    await this.userProfileRepository.save(profile);

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

  // ===== OTP Register Flow (in-memory) =====

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
  }

  async requestRegisterOtp(email: string) {
    // chặn gửi OTP nếu email đã tồn tại
    const existed = await this.userRepository.findOne({ where: { email } });
    if (existed) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const code = this.generateOtp();
    this.otpStore.set(email, {
      code,
      expiresAt: Date.now() + this.otpTtlMs,
      attempts: 0,
    });

    await this.mailService.send(
      email,
      'Mã xác thực đăng ký EveryMart',
      `<p>Mã OTP của bạn là: <b style="font-size:18px">${code}</b></p><p>Hiệu lực trong 2 phút.</p>`
    );
  }

  async verifyRegisterOtp(dto: VerifyRegisterOtpDto) {
    const rec = this.otpStore.get(dto.email);
    if (!rec) throw new BadRequestException('OTP không tồn tại');
    if (Date.now() > rec.expiresAt) {
      this.otpStore.delete(dto.email);
      throw new BadRequestException('OTP đã hết hạn');
    }
    if (rec.attempts >= this.otpMaxAttempts) {
      throw new BadRequestException('Quá số lần thử OTP');
    }
    if (rec.code !== dto.code) {
      rec.attempts += 1;
      this.otpStore.set(dto.email, rec);
      throw new BadRequestException('Mã OTP không đúng');
    }

    // OTP đúng -> xoá OTP
    this.otpStore.delete(dto.email);

    // Tạo tài khoản tái dùng logic register sẵn có
    const { code, ...createPayload } = dto as any;
    return this.register(createPayload as CreateUserDto);
  }

  // ===== Upload Avatar =====
  async uploadAvatar(
    targetUserId: number,
    currentUserId: number,
    file: Express.Multer.File
  ): Promise<{ avatar_url: string }> {
    // chỉ cho chính chủ đổi ảnh
    if (!currentUserId || currentUserId !== targetUserId) {
      throw new ForbiddenException('You cannot update this user');
    }

    // validate ảnh
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG/PNG/WebP allowed');
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      throw new BadRequestException('File size must be <= 5MB');
    }

    // lưu file
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `user_${targetUserId}_${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // cập nhật profile
    await this.userProfileRepository
      .createQueryBuilder()
      .update()
      .set({ avatar_url: avatarUrl })
      .where('user_id = :id', { id: targetUserId })
      .execute();

    return { avatar_url: avatarUrl };
  }

  async updateAffiliateStatus(
    userId: number,
    isAffiliate: boolean
  ): Promise<User> {
    const res: UpdateResult = await this.userRepository.update(userId, {
      is_affiliate: isAffiliate,
    });
    if (res.affected === 0) {
      throw new NotFoundException(
        `User with id ${userId} not found or status not changed.`
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user)
      throw new NotFoundException(
        `User with id ${userId} not found after update`
      );
    return user;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const result = await this.userRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async isUserAffiliate(userId: number): Promise<boolean> {
    const user = await this.findOne(userId);
    return user.is_affiliate;
  }
}
