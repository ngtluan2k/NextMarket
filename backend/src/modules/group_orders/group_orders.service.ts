import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { GroupOrder } from './group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { Order } from '../orders/order.entity';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';

@Injectable()
export class GroupOrdersService {
  constructor(
    @InjectRepository(GroupOrder)
    private readonly groupOrderRepo: Repository<GroupOrder>,
    @InjectRepository(GroupOrderMember)
    private readonly memberRepo: Repository<GroupOrderMember>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly config: ConfigService
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async lockExpiredGroups() {
    const now = new Date();
    const expired = await this.groupOrderRepo.find({
      where: {
        status: 'open',
        expires_at: LessThan(now),
      },
      select: { id: true },
    });
    if (!expired.length) return;
    await this.groupOrderRepo
      .createQueryBuilder()
      .update(GroupOrder)
      .set({ status: 'locked' })
      .whereInIds(expired.map((g) => g.id))
      .execute();
  }

  async createGroupOrder(dto: CreateGroupOrderDto) {
    const now = new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= now) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const group = this.groupOrderRepo.create({
      store: { id: dto.storeId } as any,
      user: { id: dto.hostUserId } as any, // host
      name: dto.name,
      status: 'open',
      expires_at: expiresAt,
      join_code: this.generateJoinCode(),
      invite_link: null,
    });

    const saved = await this.groupOrderRepo.save(group);
    // cập nhật invite_link dựa trên uuid
    console.log('FE_BASE_URL =', this.config.get<string>('FE_BASE_URL'));

    const baseUrl = this.config.get<string>('FE_BASE_URL');
    const inviteLink = `${baseUrl}/group/${saved.uuid}`;
    if (saved.invite_link !== inviteLink) {
      await this.groupOrderRepo.update(
        { id: saved.id },
        { invite_link: inviteLink }
      );
    }

    // ensure host is a member
    const hostMember = this.memberRepo.create({
      group_order: { id: saved.id } as any,
      user: { id: dto.hostUserId } as any,
      is_host: true,
      status: 'joined',
    });
    await this.memberRepo.save(hostMember);

    return this.getGroupOrderById(saved.id);
  }

  async getGroupOrderById(id: number) {
    const group = await this.groupOrderRepo.findOne({
      where: { id } as FindOptionsWhere<GroupOrder>,
      relations: [
        'store',
        'user',
        'members',
        'items',
        'orders',
        'members.user',
      ],
    });
    if (!group) throw new NotFoundException('Group order not found');
    return group;
  }

  async joinGroupOrder(userId: number, groupId: number) {
    const group = await this.groupOrderRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group order not found');
    if (group.status !== 'open') {
      throw new BadRequestException('Group is not open for joining');
    }
    if (group.expires_at && group.expires_at.getTime() <= Date.now()) {
      throw new BadRequestException('Group is expired');
    }

    const existed = await this.memberRepo.findOne({
      where: {
        group_order: { id: groupId } as any,
        user: { id: userId } as any,
      },
    });
    if (existed) return existed;

    const member = this.memberRepo.create({
      group_order: { id: groupId } as any,
      user: { id: userId } as any,
      is_host: false,
      status: 'joined',
    });
    return this.memberRepo.save(member);
  }

  async listOrdersInGroup(groupId: number) {
    // returns orders linked to this group
    return this.orderRepo.find({
      where: { group_order: { id: groupId } as any },
      relations: ['user', 'store', 'orderItem'],
      order: { createdAt: 'DESC' },
    });
  }

  private generateJoinCode(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async joinGroupOrderByUuid(userId: number, uuid: string) {
    const group = await this.groupOrderRepo.findOne({ where: { uuid } });
    if (!group) throw new NotFoundException('Group order not found');
    return this.joinGroupOrder(userId, group.id);
  }

  async updateGroupOrder(
    id: number,
    dto: { name?: string; expiresAt?: string | null }
  ) {
    const group = await this.groupOrderRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group order not found');

    const patch: Partial<GroupOrder> = {};
    if (typeof dto.name === 'string' && dto.name.trim())
      patch.name = dto.name.trim();

    if (dto.expiresAt === null) {
      patch.expires_at = null;
    } else if (dto.expiresAt) {
      const d = new Date(dto.expiresAt);
      if (isNaN(d.getTime()))
        throw new BadRequestException('Invalid expiresAt');
      if (d <= new Date())
        throw new BadRequestException('expiresAt must be in the future');
      patch.expires_at = d;
    }

    await this.groupOrderRepo.update({ id }, patch);
    return this.getGroupOrderById(id);
  }

  async deleteGroupOrder(id: number) {
    const group = await this.groupOrderRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group order not found');
    await this.groupOrderRepo.delete(id);
    return { success: true };
  }

  async getGroupOrderByUuid(uuid: string) {
    const group = await this.groupOrderRepo.findOne({
      where: { uuid },
      relations: ['store', 'user', 'members', 'items', 'orders'],
    });
    if (!group) throw new NotFoundException('Group order not found');
    return group;
  }
}
