import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateProgramsService } from './affiliate-program.service';
import { AffiliateProgramsController } from './affiliate-program.controller';
import { AffiliateProgram } from './affiliate-program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateProgram])],
  controllers: [AffiliateProgramsController],
  providers: [AffiliateProgramsService],
  exports: [AffiliateProgramsService, TypeOrmModule],
})
export class AffiliateProgramsModule {}