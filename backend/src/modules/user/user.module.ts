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
import { PerformanceTestController } from './performance-test.controller';
import { JwtStrategy } from '../../common/auth/jwt.strategy';

import { ShoppingCart } from '../cart/cart.entity';
import { OtpService } from '../../common/otp/otp.service';
import { MailService } from '../../common/mail/mail.service';
import { AffiliateTreeService } from '../affiliate-tree/affiliate-tree.service';
import { VoucherCollection } from '../voucher-collection/voucher-collection.entity';
import { RevokedTokensModule } from '../../common/auth/revoked-tokens.module';
import { Wallet } from '../wallet/wallet.entity';
import { BcryptPerformanceService } from './bcrypt-performance.service';

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
      AffiliateTreeService,
      VoucherCollection,
      Wallet
    ]),
    RevokedTokensModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || '123', // nên đưa vào .env
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UserService, JwtStrategy, OtpService, MailService, BcryptPerformanceService],
  controllers: [UserController, PerformanceTestController],
  exports: [UserService],
})
export class UserModule {}
