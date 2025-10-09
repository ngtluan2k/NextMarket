import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { Store } from '../store/store.entity';
import { StoreFollowersService } from './store-followers.service';
import { StoreFollowersController } from './store-followers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreFollower, Store])],
  controllers: [StoreFollowersController],
  providers: [StoreFollowersService],
  exports: [StoreFollowersService],
})
export class StoreFollowersModule {}
