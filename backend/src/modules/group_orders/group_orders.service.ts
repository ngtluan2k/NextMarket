import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { GroupOrder } from './group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { Order } from '../orders/order.entity';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Store } from '../store/store.entity';
import { GroupOrdersGateway } from './group_orders.gateway';
import { GroupOrderItemsService } from '../group_orders_items/group_orders_items.service';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';
import { PaymentsService } from '../payments/payments.service';
import { OrderItem } from '../order-items/order-item.entity';
import { LessThan } from 'typeorm';
import { UserAddress } from '../user_address/user_address.entity';

@Injectable()
export class GroupOrdersService {
    constructor(
        @InjectRepository(GroupOrder)
        private readonly groupOrderRepo: Repository<GroupOrder>,
        @InjectRepository(GroupOrderMember)
        private readonly memberRepo: Repository<GroupOrderMember>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
        private readonly config: ConfigService,
        @Inject(forwardRef(() => GroupOrdersGateway))
        private readonly gateway: GroupOrdersGateway,
        @Inject(forwardRef(() => GroupOrderItemsService))
        private readonly groupOrderItemsService: GroupOrderItemsService,
        @InjectRepository(GroupOrderItem)
        private readonly groupOrderItemRepo: Repository<GroupOrderItem>,
        private readonly paymentsService: PaymentsService,
        @InjectRepository(OrderItem)
        private readonly orderItemsRepo: Repository<OrderItem>,
        @InjectRepository(UserAddress)
        private readonly userAddressRepo: Repository<UserAddress>
    ) { }

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
        for (const g of expired) {
            await this.gateway.broadcastGroupUpdate(g.id, 'group-locked', {
                groupId: g.id,
            });
        }
    }

    async createGroupOrder(dto: CreateGroupOrderDto) {
        const store = await this.storeRepo.findOne({ where: { id: dto.storeId } });
        if (!store) throw new NotFoundException('Store not found');
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
        await this.gateway.notifyUser(dto.hostUserId, 'group-created', {
            groupId: saved.id,
            invite_link: inviteLink,
        });

        return this.getGroupOrderById(saved.id);
    }

    async getGroupOrderById(id: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id } as FindOptionsWhere<GroupOrder>,
            relations: [
                'store',
                'user',
                'user.profile',
                'members',
                'items',
                'orders',
                'members.user',
                'members.user.profile',
                'members.address_id',
                'items.member',
                'items.member.user',
                'items.member.address_id',
                'items.product',
            ],
            loadEagerRelations: true,
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
        const savedMember = await this.memberRepo.save(member);
        // Cập nhật lại discount của group
        await this.groupOrderItemsService.updateGroupDiscount(groupId);

        // Broadcast cho mọi người trong group biết có người mới tham gia
        await this.gateway.broadcastGroupUpdate(groupId, 'member-joined', {
            userId,
            member: savedMember,
        });

        return savedMember;
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
        userId: number,
        dto: {
            name?: string;
            delivery_mode?: 'host_address' | 'member_address'; // ← Thêm field này
            expiresAt?: string | null; // ← Thêm luôn cho deadline
        }
    ) {
        const group = await this.groupOrderRepo.findOne({
            where: { id },
            relations: ['user'], // để lấy host
        });
        if (!group) throw new NotFoundException('Group order not found');

        // 🔒 Kiểm tra quyền
        if (group.user.id !== userId) {
            throw new BadRequestException('Bạn không có quyền sửa nhóm này');
        }

        const patch: Partial<GroupOrder> = {};

        //  Xử lý name
        if (typeof dto.name === 'string' && dto.name.trim()) {
            patch.name = dto.name.trim();
        }

        //  Xử lý delivery_mode
        if (dto.delivery_mode && ['host_address', 'member_address'].includes(dto.delivery_mode)) {
            patch.delivery_mode = dto.delivery_mode;
        }

        //  Xử lý expiresAt
        if ('expiresAt' in dto) {
            if (dto.expiresAt === null) {
                patch.expires_at = null;
            } else if (dto.expiresAt) {
                const expiresAt = new Date(dto.expiresAt);
                if (expiresAt <= new Date()) {
                    throw new BadRequestException('expiresAt must be in the future');
                }
                patch.expires_at = expiresAt;
            }
        }

        //  Kiểm tra xem có field nào để update không
        if (Object.keys(patch).length === 0) {
            throw new BadRequestException('No fields to update');
        }

        await this.groupOrderRepo.update({ id }, patch);
        const updated = await this.getGroupOrderById(id);

        // Broadcast cập nhật group
        await this.gateway.broadcastGroupUpdate(id, 'group-updated', {
            group: updated,
        });

        return updated;
    }

    async deleteGroupOrder(id: number, userId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id },
            relations: ['user'], // cần để biết host là ai
        });
        if (!group) throw new NotFoundException('Group order not found');

        // 🔒 Kiểm tra quyền
        if (group.user.id !== userId) {
            throw new BadRequestException('Bạn không có quyền xóa nhóm này');
        }

        await this.groupOrderRepo.delete(id);

        // Broadcast xóa group
        await this.gateway.broadcastGroupUpdate(id, 'group-deleted', {
            groupId: id,
        });

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

    async getUserActiveGroups(userId: number) {
        return this.memberRepo.find({
            where: {
                user: { id: userId } as any,
                status: 'joined',
            },
            relations: ['group_order', 'group_order.store', 'group_order.user'],
            order: { joined_at: 'DESC' },
        });
    }

    async getUserActiveGroupOrders(userId: number) {
        const members = await this.getUserActiveGroups(userId);
        return members
            .filter((member) => member.group_order) // Lọc bỏ những member có group_order null
            .map((member) => ({
                id: member.group_order.id,
                name: member.group_order.name,
                status: member.group_order.status,
                expires_at: member.group_order.expires_at,
                is_host: member.is_host,
                store: member.group_order.store,
                host: member.group_order.user,
                joined_at: member.joined_at,
            }));
    }

    async updateMemberAddress(groupId: number, userId: number, addressId: number) {
        // 1. Kiểm tra group tồn tại
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
        });
        if (!group) {
            throw new NotFoundException('Group order not found');
        }

        // 2. Tìm member trong group
        const member = await this.memberRepo.findOne({
            where: {
                group_order: { id: groupId } as any,
                user: { id: userId } as any,
            },
        });
        if (!member) {
            throw new NotFoundException('You are not a member of this group');
        }

        // 3. Kiểm tra địa chỉ có thuộc về user không
        const address = await this.userAddressRepo.findOne({
            where: {
                id: addressId,
                user: { id: userId } as any,
            },
        });
        if (!address) {
            throw new BadRequestException('Address not found or does not belong to you');
        }

        // 4. Update địa chỉ cho member
        await this.memberRepo.update(
            { id: member.id },
            { address_id: address as any }
        );

        // 5. Broadcast update qua WebSocket (real-time)
        await this.gateway.broadcastGroupUpdate(groupId, 'member-address-updated', {
            userId,
            memberId: member.id,
            addressId,
        });

        return {
            success: true,
            message: 'Address updated successfully',
            member: {
                id: member.id,
                address: address,
            },
        };
    }


    async checkoutGroupOrder(
        groupId: number,
        userId: number,
        paymentMethodUuid: string,
        addressId?: number
    ) {
        // 1) Validate group + quyền host + trạng thái
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['user', 'store', 'members', 'members.user', 'members.address_id'],
        });
        if (!group) throw new NotFoundException('Group order not found');
        if (group.user.id !== userId) {
            throw new BadRequestException('Chỉ host mới được thanh toán cho nhóm');
        }
        if (group.status !== 'open') {
            throw new BadRequestException('Group không ở trạng thái mở');
        }

        // 2) Lấy items của group
        const items = await this.groupOrderItemRepo.find({
            where: { group_order: { id: groupId } as any },
            relations: ['product', 'variant', 'member', 'member.user', 'member.address_id'],
            order: { id: 'ASC' },
        });
        if (!items.length) {
            throw new BadRequestException('Nhóm chưa có sản phẩm');
        }

        try {
            // 3) Lock group trong lúc thanh toán
            await this.groupOrderRepo.update(groupId, { status: 'locked' });
            await this.gateway.broadcastGroupUpdate(groupId, 'group-locked', { groupId });

            // 4) Xử lý theo delivery_mode
            if (group.delivery_mode === 'host_address') {
                return await this.checkoutHostAddress(
                    group,
                    userId,
                    addressId,
                    paymentMethodUuid,
                    items
                );
            } else {
                return await this.checkoutMemberAddresses(
                    group,
                    userId,
                    paymentMethodUuid,
                    items
                );
            }
        } catch (err) {
            // Rollback lock nếu lỗi
            await this.groupOrderRepo.update(groupId, { status: 'open' });
            await this.gateway.broadcastGroupUpdate(groupId, 'group-updated', {
                groupId,
                status: 'open',
            });
            throw err;
        }
    }


    private async checkoutHostAddress(
        group: GroupOrder,
        userId: number,
        addressId: number | undefined,
        paymentMethodUuid: string,
        items: GroupOrderItem[]
    ) {
        // Validate: Host phải chọn địa chỉ
        if (!addressId) {
            throw new BadRequestException('Vui lòng chọn địa chỉ giao hàng');
        }

        const address = await this.userAddressRepo.findOne({
            where: { id: addressId, user: { id: userId } as any },
        });
        if (!address) {
            throw new BadRequestException('Địa chỉ không hợp lệ');
        }

        // Tính tiền
        const subtotal = items.reduce((s, it) => s + Number(it.price || 0), 0);
        const shippingFee = 0;
        const discountTotal = 0;
        const totalAmount = subtotal + shippingFee - discountTotal;

        // Tạo 1 Order duy nhất
        const order = this.orderRepo.create({
            user: { id: userId } as any,
            store: { id: group.store.id } as any,
            userAddress: { id: address.id } as any,
            group_order: { id: group.id } as any,
            subtotal,
            shippingFee,
            discountTotal,
            totalAmount,
            status: 1,
        });
        const savedOrder = await this.orderRepo.save(order);

        // Tạo OrderItems
        for (const it of items) {
            const oi = this.orderItemsRepo.create({
                order: { id: savedOrder.id } as any,
                product: { id: it.product.id } as any,
                variant: it.variant ? ({ id: it.variant.id } as any) : null,
                quantity: it.quantity,
                price: it.price,
                groupOrderItem: { id: it.id } as any,
                note: it.note,
            });
            await this.orderItemsRepo.save(oi);
        }

        // Gọi thanh toán
        if (!paymentMethodUuid) {
            throw new BadRequestException('Thiếu paymentMethodUuid');
        }

        const result = await this.paymentsService.create({
            orderUuid: savedOrder.uuid,
            paymentMethodUuid,
            amount: Number(totalAmount || 0),
            isGroup: true,
        });

        const payment = 'payment' in result ? result.payment : result;
        const redirectUrl = 'redirectUrl' in result ? result.redirectUrl : null;

        return {
            orderUuid: savedOrder.uuid,
            payment,
            redirectUrl,
        };
    }



    private async checkoutMemberAddresses(
        group: GroupOrder,
        userId: number,
        paymentMethodUuid: string,
        items: GroupOrderItem[]
    ) {
        // Validate: Tất cả members phải có địa chỉ
        const membersWithoutAddress = group.members.filter(m => !m.address_id);
        if (membersWithoutAddress.length > 0) {
            const names = membersWithoutAddress
                .map(m => m.user?.username || `User #${m.user?.id}`)
                .join(', ');
            throw new BadRequestException(
                `Các thành viên sau chưa có địa chỉ: ${names}`
            );
        }

        // Nhóm items theo member
        const itemsByMember = new Map<number, GroupOrderItem[]>();

        for (const item of items) {
            const memberId = item.member.id;
            if (!itemsByMember.has(memberId)) {
                itemsByMember.set(memberId, []);
            }
            itemsByMember.get(memberId)!.push(item);
        }

        const createdOrders = [];
        let grandTotal = 0;

        // Tạo Order cho mỗi member
        for (const [memberId, memberItems] of itemsByMember.entries()) {
            const member = group.members.find(m => m.id === memberId);
            if (!member || !member.address_id) {
                throw new BadRequestException(
                    `Member #${memberId} không có địa chỉ`
                );
            }

            const subtotal = memberItems.reduce((s, it) => s + Number(it.price || 0), 0);
            grandTotal += subtotal;

            // Tạo order cho member này
            const order = this.orderRepo.create({
                user: { id: member.user.id } as any,  // Host vẫn là người thanh toán
                store: { id: group.store.id } as any,
                userAddress: { id: member.address_id.id } as any,  // ← Địa chỉ của member
                group_order: { id: group.id } as any,
                subtotal,
                shippingFee: 0,
                discountTotal: 0,
                totalAmount: subtotal,
                status: 1,
            });
            const savedOrder = await this.orderRepo.save(order);
            createdOrders.push(savedOrder);

            // Tạo OrderItems cho order này
            for (const it of memberItems) {
                const oi = this.orderItemsRepo.create({
                    order: { id: savedOrder.id } as any,
                    product: { id: it.product.id } as any,
                    variant: it.variant ? ({ id: it.variant.id } as any) : null,
                    quantity: it.quantity,
                    price: it.price,
                    groupOrderItem: { id: it.id } as any,
                    note: it.note,
                });
                await this.orderItemsRepo.save(oi);
            }
        }

        // Gọi thanh toán cho order đầu tiên (đại diện)
        if (!paymentMethodUuid) {
            throw new BadRequestException('Thiếu paymentMethodUuid');
        }

        const result = await this.paymentsService.create({
            orderUuid: createdOrders[0].uuid,
            paymentMethodUuid,
            amount: Number(grandTotal || 0),
            isGroup: true,
        });

        const payment = 'payment' in result ? result.payment : result;
        const redirectUrl = 'redirectUrl' in result ? result.redirectUrl : null;

        return {
            orderUuid: createdOrders[0].uuid,
            orderCount: createdOrders.length,
            payment,
            redirectUrl,
        };
    }
}
