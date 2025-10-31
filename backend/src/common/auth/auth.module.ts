// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../modules/user/user.entity';
import { UserProfile } from '../../modules/admin/entities/user-profile.entity';
import { Role } from '../../modules/role/role.entity';
import { UserRole } from '../../modules/user-role/user-role.entity';
import { RolePermission } from '../../modules/role-permission/role-permission.entity';
import { Permission } from '../../modules/permission/permission.entity';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Role,
      UserRole,
      RolePermission,
      Permission,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || '123',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
