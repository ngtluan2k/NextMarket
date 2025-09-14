import { CategoryModule } from './modules/categories/category.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { StoreModule } from './modules/store/store.module';
import { BrandModule } from './modules/brands/brands.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { StoreRating } from './modules/store-rating/store-rating.entity';


@Module({
  imports: [
    // Đọc file .env
    ConfigModule.forRoot({
      isGlobal: true, // để tất cả module khác đều dùng được
      
    }),

    // Cấu hình DB dùng ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD') ?? '',
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false, //change to true if you want to start server;
      }),
    }),

    ProductModule,
    UserModule,
    CategoryModule,
    StoreRating,
    StoreModule,
    BrandModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    UserRoleModule,
  ]
})
export class AppModule {}
