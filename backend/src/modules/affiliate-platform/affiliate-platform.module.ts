import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatePlatform } from './affiliate-platform.entity';
import { AffiliatePlatformService } from './affiliate-platform.service';
import { AffiliatePlatformController } from './affiliate-platform.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliatePlatform])],
  controllers: [AffiliatePlatformController],
  providers: [AffiliatePlatformService],
  exports: [AffiliatePlatformService],
})
export class AffiliatePlatformModule {}
