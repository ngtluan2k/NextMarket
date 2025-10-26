import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from './user.entity';
import { UserProfile } from '../admin/entities/user-profile.entity';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';
import { RolePermission } from '../role-permission/role-permission.entity';
import { UserRole } from '../user-role/user-role.entity';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtStrategy } from '../../common/auth/jwt.strategy';

import { ShoppingCart } from '../cart/cart.entity';
import { OtpService } from '../../common/otp/otp.service';
import { MailService } from '../../common/mail/mail.service';
import { AffiliateTreeService } from '../affiliate-tree/affiliate-tree.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Role,
      Permission,
      RolePermission,
      UserRole,
      ShoppingCart,
      AffiliateTreeService
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || '123', // nên đưa vào .env
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [UserService, JwtStrategy, OtpService, MailService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
