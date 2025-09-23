import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreIdentificationService } from './store-identification.service';
import { StoreIdentificationController } from './store-identification.controller';
import { StoreIdentification } from './store-identification.entity';
import { Store } from '../store/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreIdentification, Store])],
  controllers: [StoreIdentificationController],
  providers: [StoreIdentificationService],
  exports: [StoreIdentificationService],
})
export class StoreIdentificationModule {}