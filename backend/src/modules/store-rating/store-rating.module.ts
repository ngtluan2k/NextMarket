import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreRating } from './store-rating.entity';
import { Store } from '../store/store.entity';
import { StoreRatingService } from './store-rating.service';
import { StoreRatingController } from './store-rating.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreRating, Store])],
  providers: [StoreRatingService],
  controllers: [StoreRatingController],
  exports: [StoreRatingService],
})
export class StoreRatingModule {}