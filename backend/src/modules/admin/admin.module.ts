import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';
import { UserRole } from '../user-role/user-role.entity';
import { User } from '../user/user.entity';
import { RolePermission } from '../role-permission/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      UserRole,
      User,
      RolePermission,
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
