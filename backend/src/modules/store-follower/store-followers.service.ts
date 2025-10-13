import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { Store } from '../store/store.entity';

@Injectable()
export class StoreFollowersService {
  constructor(
    @InjectRepository(StoreFollower)
    private readonly followerRepo: Repository<StoreFollower>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>
  ) {}

  private async assertStore(storeId: number) {
    const store = await this.storeRepo.findOne({
      where: { id: storeId, is_deleted: false },
    });
    if (!store) throw new NotFoundException('Store not found');
  }

  async follow(userId: number, storeId: number) {
    await this.assertStore(storeId);
    const exists = await this.followerRepo.findOne({
      where: { user_id: userId, store_id: storeId },
    });
    if (exists) return { followed: true };
    const row = this.followerRepo.create({
      user_id: userId,
      store_id: storeId,
    });
    await this.followerRepo.save(row);
    return { followed: true };
  }

  async unfollow(userId: number, storeId: number) {
    await this.assertStore(storeId);
    const exists = await this.followerRepo.findOne({
      where: { user_id: userId, store_id: storeId },
    });
    if (!exists) return { followed: false };
    await this.followerRepo.remove(exists);
    return { followed: false };
  }

  async toggle(userId: number, storeId: number) {
    const status = await this.isFollowing(userId, storeId);
    return status.followed
      ? this.unfollow(userId, storeId)
      : this.follow(userId, storeId);
  }

  async isFollowing(userId: number, storeId: number) {
    await this.assertStore(storeId);
    const exists = await this.followerRepo.findOne({
      where: { user_id: userId, store_id: storeId },
    });
    return { followed: !!exists };
  }

  async count(storeId: number) {
    await this.assertStore(storeId);
    const count = await this.followerRepo.count({
      where: { store_id: storeId },
    });
    return { count };
  }
}
