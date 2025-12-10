import { use } from 'react';
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
    forwardRef,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
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
import { OrderStatuses } from '../orders/types/orders';
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { historyStatus } from '../order-status-history/order-status-history.entity';
import { VouchersService } from '../vouchers/vouchers.service';
import { Voucher, VoucherType } from '../vouchers/vouchers.entity';



@Injectable()
export class GroupOrdersService {
    private readonly logger = new Logger(GroupOrdersService.name);
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
        @Inject(forwardRef(() => PaymentsService))
        private readonly paymentsService: PaymentsService,
        @InjectRepository(OrderItem)
        private readonly orderItemsRepo: Repository<OrderItem>,
        @InjectRepository(UserAddress)
        private readonly userAddressRepo: Repository<UserAddress>,
        @InjectRepository(OrderStatusHistory)
        private orderStatusHistoryRepo: Repository<OrderStatusHistory>,
        @Inject(forwardRef(() => VouchersService))
        private readonly vouchersService: VouchersService,

    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleExpiredGroups() {
        const now = new Date();

        // 1) Nhóm đang OPEN, quá hạn => auto-lock + remove member chưa chọn sản phẩm
        const openGroups = await this.groupOrderRepo.find({
            where: {
                status: 'open',
                expires_at: LessThan(now),
            },
            relations: ['members', 'members.user'],
        });

        for (const group of openGroups) {
            this.logger.log(` Auto-processing OPEN group #${group.id}`);

            // Lấy tất cả members active (joined / ordered)
            const activeMembers = group.members.filter((m) =>
                ['joined', 'ordered'].includes(m.status)
            );

            if (!activeMembers.length) {
                // Không còn ai => hủy luôn
                await this.groupOrderRepo.update(group.id, {
                    status: 'cancelled',
                    order_status: OrderStatuses.cancelled,
                });

                await this.markRefundedForCancelledGroup(group.id);

                await this.gateway.broadcastGroupUpdate(group.id, 'group-cancelled-timeout', {
                    groupId: group.id,
                    reason: 'Hết thời gian mở nhóm, không có thành viên hoạt động',
                });
                continue;
            }

            // Lấy tất cả items trong group để biết member nào đã chọn sản phẩm
            const items = await this.groupOrderItemRepo.find({
                where: { group_order: { id: group.id } as any },
                relations: ['member'],
            });

            const memberIdsWithItems = new Set(items.map((it) => it.member.id));
            const membersToRemove = activeMembers.filter(
                (m) => !memberIdsWithItems.has(m.id) && !m.is_host //  không xóa host
            );

            if (membersToRemove.length) {
                // Xóa items của các member này (nếu có) + xóa member
                const memberIds = membersToRemove.map((m) => m.id);

                await this.groupOrderItemRepo.delete({
                    group_order: { id: group.id } as any,
                    member: In(memberIds) as any,
                });

                await this.memberRepo.delete(memberIds);

                // Broadcast cho group biết các member bị remove
                for (const m of membersToRemove) {
                    await this.gateway.broadcastGroupUpdate(group.id, 'member-auto-removed', {
                        userId: m.user.id,
                        memberId: m.id,
                        reason: 'Hết thời gian chọn sản phẩm',
                    });
                }
            }

            // Đếm lại activeMembers sau khi remove
            const remainingMembers = await this.memberRepo.count({
                where: {
                    group_order: { id: group.id } as any,
                    status: In(['joined', 'ordered']) as any,
                },
            });

            if (remainingMembers < 2) {
                // Không đủ 2 người => HỦY nhóm
                await this.groupOrderRepo.update(group.id, {
                    status: 'cancelled',
                    order_status: OrderStatuses.cancelled,
                });

                await this.markRefundedForCancelledGroup(group.id);

                await this.gateway.broadcastGroupUpdate(group.id, 'group-cancelled-timeout', {
                    groupId: group.id,
                    reason: 'Không đủ thành viên sau khi loại bỏ người chưa chọn sản phẩm',
                    remainingMembers,
                });
                continue;
            }

            // Đủ người => tự động LOCK + set expires_at mới (30 phút nữa để auto-cancel)
            const nextExpires = new Date(now.getTime() + 2 * 60 * 1000);
            await this.groupOrderRepo.update(group.id, {
                status: 'locked',
                expires_at: nextExpires,
                order_status: OrderStatuses.waiting_group, // hoặc pending, tùy flow bạn
            });

            await this.gateway.broadcastGroupUpdate(group.id, 'group-auto-locked', {
                groupId: group.id,
                message:
                    ' Nhóm đã tự động khóa sau 30 phút. Những thành viên chưa chọn sản phẩm đã bị loại khỏi nhóm.',
                lockUntil: nextExpires,
            });

            this.logger.log(
                ` Group #${group.id} auto-locked, next expires_at=${nextExpires.toISOString()}`
            );
        }

        // 2) Nhóm đang LOCKED, quá hạn => CANCELLED
        const lockedGroups = await this.groupOrderRepo.find({
            where: {
                status: 'locked',
                expires_at: LessThan(now),
            },
            select: { id: true },
        });

        if (lockedGroups.length) {
            const ids = lockedGroups.map((g) => g.id);
            await this.groupOrderRepo
                .createQueryBuilder()
                .update(GroupOrder)
                .set({
                    status: 'cancelled',
                    order_status: OrderStatuses.cancelled,
                })
                .whereInIds(ids)
                .execute();

            for (const g of lockedGroups) {

                await this.markRefundedForCancelledGroup(g.id);

                await this.gateway.broadcastGroupUpdate(g.id, 'group-cancelled-timeout', {
                    groupId: g.id,
                    message: '⏰ Nhóm đã bị hủy vì quá 30 phút sau khi khóa mà không hoàn tất.',
                });
            }

            this.logger.log(`❌ Auto-cancelled ${lockedGroups.length} locked groups by timeout`);
        }
    }

    async findOne(
        id: number,
        options?: { relations?: string[] }
    ): Promise<GroupOrder> {
        const query: any = { where: { id } };

        if (options?.relations) {
            query.relations = options.relations;
        }

        const group = await this.groupOrderRepo.findOne(query);

        if (!group) {
            throw new NotFoundException(`Group order #${id} not found`);
        }

        return group;
    }

    async createGroupOrder(dto: CreateGroupOrderDto) {
        const store = await this.storeRepo.findOne({ where: { id: dto.storeId } });
        if (!store) throw new NotFoundException('Store not found');
        const now = new Date();


        const expiresAt = dto.expiresAt
            ? new Date(dto.expiresAt)
            : new Date(now.getTime() + 30 * 60 * 1000);
        if (expiresAt && expiresAt <= now) {
            throw new BadRequestException('expiresAt must be in the future');
        }

        const joinExpiresAt = dto.joinExpiresAt ? new Date(dto.joinExpiresAt) : null;
        if (joinExpiresAt && joinExpiresAt <= now) {
            throw new BadRequestException('joinExpiresAt must be in the future');
        }

        if (expiresAt && joinExpiresAt && joinExpiresAt > expiresAt) {
            throw new BadRequestException('joinExpiresAt must be before expiresAt');
        }

        const group = this.groupOrderRepo.create({
            store: { id: dto.storeId } as any,
            user: { id: dto.hostUserId } as any, // host
            name: dto.name,
            status: 'open',
            expires_at: expiresAt,
            join_expires_at: joinExpiresAt,
            join_code: this.generateJoinCode(),
            invite_link: null,
            target_member_count: dto.targetMemberCount || 2,
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
            is_host: 1 as any, // Temporary fix: use 1 instead of true for integer column
            status: 'joined',
        });
        await this.memberRepo.save(hostMember);
        await this.gateway.notifyUser(dto.hostUserId, 'group-created', {
            groupId: saved.id,
            invite_link: inviteLink,
        });

        return this.getGroupOrderById(saved.id, dto.hostUserId);
    }

    async getGroupOrderById(id: number, userId: number) {
        await this.assertUserIsMember(id, userId);
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

    private async assertUserIsMember(groupId: number, userId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['members', 'members.user'],
        });
        if (!group) throw new NotFoundException('Group not found');

        const isMember = group.members.some((m) => m.user.id === userId);
        if (!isMember) {
            throw new ForbiddenException('Bạn không thuộc nhóm này');
        }
        return group;
    }

    async joinGroupOrder(userId: number, groupId: number, joinCode?: string) {
        const group = await this.groupOrderRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group order not found');
        if (group.status !== 'open') {
            throw new BadRequestException('Group is not open for joining');
        }
        if (group.expires_at && group.expires_at.getTime() <= Date.now()) {
            throw new BadRequestException('Group is expired');
        }
        if (group.join_expires_at && group.join_expires_at.getTime() <= Date.now()) {
            throw new BadRequestException('Đã quá thời hạn tham gia nhóm');
        }
        if (joinCode !== undefined && group.join_code && group.join_code !== joinCode.trim().toUpperCase()) {
            throw new BadRequestException('Mã tham gia không hợp lệ');
        }

        if (group.target_member_count) {
            const currentCount = await this.memberRepo.count({
                where: { group_order: { id: groupId } as any },
            });

            if (currentCount >= group.target_member_count) {
                throw new BadRequestException('Nhóm đã đủ số lượng thành viên');
            }
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
            is_host: 0 as any, // Temporary fix: use 0 instead of false for integer column
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
        // await this.autoLockIfReachedTarget(groupId);

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

    async getGroupOrderByJoinCode(joinCode: string) {
        const group = await this.groupOrderRepo.findOne({
            where: { join_code: joinCode.toUpperCase() },
            relations: ['store'],
        });
        if (!group) throw new NotFoundException('Group order not found');
        return group;
    }

    async joinGroupOrderByJoinCode(joinCode: string, userId: number) {
        const group = await this.getGroupOrderByJoinCode(joinCode);
        return this.joinGroupOrder(userId, group.id, joinCode);
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
            expiresAt?: string | null;
            joinExpiresAt?: string | null;
            targetMemberCount?: number;
        }
    ) {
        const group = await this.groupOrderRepo.findOne({
            where: { id },
            relations: ['user'], // để lấy host
        });
        if (!group) throw new NotFoundException('Group order not found');

        //  Kiểm tra quyền
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


        if ('joinExpiresAt' in dto) {
            if (dto.joinExpiresAt === null) {
                patch.join_expires_at = null;
            } else if (dto.joinExpiresAt) {
                const joinExpiresAt = new Date(dto.joinExpiresAt);
                if (joinExpiresAt <= new Date()) {
                    throw new BadRequestException('joinExpiresAt must be in the future');
                }
                patch.join_expires_at = joinExpiresAt;
            }
        }

        if (typeof dto.targetMemberCount === 'number') {
            if (dto.targetMemberCount < 2 || dto.targetMemberCount > 100) {
                throw new BadRequestException('targetMemberCount phải từ 2 đến 100');
            }
            // Chỉ cho phép sửa khi nhóm chưa lock
            if (group.status !== 'open') {
                throw new BadRequestException('Không thể sửa mục tiêu khi nhóm đã khóa');
            }
            patch.target_member_count = dto.targetMemberCount;
        }


        //  Kiểm tra xem có field nào để update không
        if (Object.keys(patch).length === 0) {
            throw new BadRequestException('No fields to update');
        }


        await this.groupOrderRepo.update({ id }, patch as any);
        const updated = await this.getGroupOrderById(id, userId);

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
                status: In(['joined', 'paid']),
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
        addressId?: number,
        voucherCode?: string
    ) {
        // 1) Validate group + quyền host
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['user', 'store', 'members', 'members.user', 'members.address_id'],
        });
        if (!group) throw new NotFoundException('Group order not found');

        if (group.user.id !== userId) {
            throw new BadRequestException('Chỉ host mới được thanh toán cho nhóm');
        }

        //  CHỈ CHO PHÉP host_address mode
        if (group.delivery_mode === 'member_address') {
            throw new BadRequestException(
                'Chế độ giao hàng riêng yêu cầu mỗi thành viên tự thanh toán.'
            );
        }

        //  CHỈ CHO PHÉP khi nhóm ĐÃ LOCKED
        if (group.status !== 'locked') {
            throw new BadRequestException(
                'Vui lòng khóa nhóm trước khi thanh toán!'
            );
        }

        const activeMembers = group.members.filter(m => m.status !== 'left');
        const memberCount = activeMembers.length;

        if (memberCount > 5) {
            // Lấy thông tin payment method
            const paymentMethod = await this.paymentsService['methodsRepo'].findOne({
                where: { uuid: paymentMethodUuid }
            });

            if (!paymentMethod) {
                throw new BadRequestException('Phương thức thanh toán không hợp lệ');
            }

            // Kiểm tra nếu là COD
            if (paymentMethod.type === 'cod') {
                throw new BadRequestException(
                    `Nhóm có ${memberCount} thành viên (vượt quá 5 người). ` +
                    'Vui lòng chọn phương thức thanh toán online (VNPay, Momo, v.v.) thay vì thanh toán khi nhận hàng!'
                );
            }

            this.logger.log(
                ` Group #${groupId} has ${memberCount} members - online payment required and validated`
            );
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

        // 3) Xử lý thanh toán (host_address mode)
        const result = await this.checkoutHostAddress(
            group,
            userId,
            addressId,
            paymentMethodUuid,
            items,
            voucherCode
        );

        console.log(` Group #${groupId} completed by host payment (host_address mode)`);

        return result;
    }


    private async checkoutHostAddress(
        group: GroupOrder,
        userId: number,
        addressId: number | undefined,
        paymentMethodUuid: string,
        items: GroupOrderItem[],
        voucherCode?: string
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

        let discountTotal = 0;
        let appliedVoucher: Voucher | null = null;

        if (voucherCode && voucherCode.trim()) {
            try {
                // Prepare order items for validation
                const orderItems = items.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: Number(item.price),
                }));

                // Validate voucher
                const validation = await this.vouchersService.validateVoucher(
                    voucherCode.trim(),
                    userId,
                    orderItems,
                    group.store.id
                );

                appliedVoucher = validation.voucher;

                // KIỂM TRA: Chỉ cho phép PLATFORM và STORE voucher
                if (
                    appliedVoucher.type !== VoucherType.PLATFORM &&
                    appliedVoucher.type !== VoucherType.STORE
                ) {
                    throw new BadRequestException(
                        `Mua nhóm chỉ được áp dụng voucher PLATFORM hoặc STORE. Voucher này là loại ${this.getVoucherTypeName(appliedVoucher.type)}.`
                    );
                }

                // KIỂM TRA THÊM: Nếu là STORE voucher, phải khớp với store của group
                if (appliedVoucher.type === VoucherType.STORE) {
                    if (appliedVoucher.store?.id !== group.store.id) {
                        throw new BadRequestException(
                            'Voucher STORE này không áp dụng cho cửa hàng của nhóm mua này.'
                        );
                    }
                }

                discountTotal = Number(validation.discount);

                this.logger.log(
                    `Voucher ${voucherCode} (${this.getVoucherTypeName(appliedVoucher.type)}) validated - Discount: ${discountTotal}đ`
                );
            } catch (err: any) {
                // Nếu voucher không hợp lệ → throw error
                const errorMsg = err instanceof BadRequestException
                    ? err.message
                    : `Voucher không hợp lệ: ${err.message}`;
                throw new BadRequestException(errorMsg);
            }
        }

        const totalAmount = Math.max(0, subtotal + shippingFee - discountTotal);

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
            status: 0,
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

        // Áp dụng voucher nếu có
        if (appliedVoucher) {
            try {
                await this.vouchersService.applyVoucher(
                    appliedVoucher.id,
                    userId,
                    savedOrder
                );
                this.logger.log(
                    ` Applied voucher ${appliedVoucher.code} to order #${savedOrder.id}`
                );
            } catch (err: any) {
                this.logger.error(` Failed to apply voucher: ${err.message}`);
            }
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
            voucherApplied: appliedVoucher ? {
                code: appliedVoucher.code,
                title: appliedVoucher.title,
                type: this.getVoucherTypeName(appliedVoucher.type),
                discount: discountTotal,
                originalAmount: subtotal,
                finalAmount: totalAmount,
            } : null,

        };
    }


    async getGroupOrderWithAllOrders(groupId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId } as FindOptionsWhere<GroupOrder>,
            relations: [
                'user',
                'user.profile',
                'store',
                'members',
                'members.user',
                'members.user.profile',
                'members.address_id',
                'items',
                'items.member',
                'items.member.user',
                'items.member.user.profile',
                'items.product',
                'items.variant',
                'orders',
                'orders.user',
                'orders.user.profile',
                'orders.userAddress',
                'orders.orderItem',
                'orders.orderItem.product',
                'orders.orderItem.variant',
                'orders.orderItem.groupOrderItem',
                'orders.payment',
            ],
        });

        if (!group) {
            throw new NotFoundException(`Group order #${groupId} not found`);
        }

        return {
            group_order_id: group.id,
            groupInfo: {
                id: group.id,
                uuid: group.uuid,
                name: group.name,
                status: group.status,
                join_code: group.join_code,
                invite_link: group.invite_link,
                expires_at: group.expires_at,
                created_at: group.created_at,
                discount_percent: group.discount_percent,
                delivery_mode: group.delivery_mode,
                user: group.user,
                store: group.store,
                members: group.members,
                items: group.items,
            },
            orders: group.orders || [],
        };
    }

    private getOrderStatusText(status: OrderStatuses): string {
        const statusMap = {
            [OrderStatuses.waiting_group]: 'Chờ Nhóm Hoàn Thành',
            [OrderStatuses.draft]: 'Nháp (Chưa thanh toán)',
            [OrderStatuses.pending]: 'Đang Chờ Xác Nhận',
            [OrderStatuses.confirmed]: 'Đã Xác Nhận',
            [OrderStatuses.processing]: 'Đang Xử Lý',
            [OrderStatuses.shipped]: 'Đã Giao Hàng',
            [OrderStatuses.delivered]: 'Shipper Đã Giao',
            [OrderStatuses.completed]: 'Hoàn Thành',
            [OrderStatuses.cancelled]: 'Đã Hủy',
            [OrderStatuses.returned]: 'Trả Hàng',
        };
        return statusMap[status] || 'Không xác định';
    }

    async updateOrderStatus(
        groupOrderId: number,
        orderStatus: OrderStatuses,
        userId?: number,
    ) {
        const groupOrder = await this.groupOrderRepo.findOne({
            where: { id: groupOrderId },
            relations: ['store', 'store.user'],
        });

        if (!groupOrder) {
            throw new NotFoundException(`Group Order #${groupOrderId} not found`);
        }
        if (userId && groupOrder.store?.user?.id !== userId) {
            throw new ForbiddenException(
                'Only the store owner can update order status'
            );
        }

        const oldStatus = groupOrder.order_status;
        groupOrder.order_status = orderStatus;
        await this.groupOrderRepo.save(groupOrder);

        return {
            success: true,
            message: `Order status updated: ${this.getOrderStatusText(oldStatus)} → ${this.getOrderStatusText(orderStatus)}`,
            data: {
                groupOrderId,
                old_status: oldStatus,
                new_status: orderStatus,
                status_text: this.getOrderStatusText(orderStatus),
            },
        };
    }

    async updateOrderStatusWithOrders(
        groupOrderId: number,
        orderStatus: OrderStatuses,
        userId?: number,
        note?: string,
    ) {
        const groupOrder = await this.groupOrderRepo.findOne({
            where: { id: groupOrderId },
            relations: ['orders', 'store', 'store.user'],
        });

        if (!groupOrder) {
            throw new NotFoundException(`Group Order #${groupOrderId} not found`);
        }
        if (userId && groupOrder.store?.user?.id !== userId) {
            throw new ForbiddenException(
                'Only the store owner can update order status'
            );
        }

        const orderIds: number[] = groupOrder.orders.map((o) => o.id);

        // 1. Lấy old_status TRƯỚC KHI update
        const oldStatusMap = new Map(
            groupOrder.orders.map(o => [o.id, o.status])
        );

        // 2. Update group order_status
        groupOrder.order_status = orderStatus;
        await this.groupOrderRepo.save(groupOrder);

        // 3. Update tất cả orders trong nhóm
        if (orderIds.length > 0) {
            await this.orderRepo
                .createQueryBuilder()
                .update(Order)
                .set({ status: orderStatus })
                .whereInIds(orderIds)
                .execute();

            // 4. Tạo OrderStatusHistory bằng create()
            const historyNote = note || `Cập nhật hàng loạt từ group order #${groupOrderId}`;

            const historiesData = orderIds.map((orderId) => ({
                order: { id: orderId } as any,
                oldStatus: oldStatusMap.get(orderId) || 0,
                newStatus: orderStatus as unknown as historyStatus,
                note: historyNote,
                changedAt: new Date(),
            }));

            const histories = this.orderStatusHistoryRepo.create(historiesData);
            await this.orderStatusHistoryRepo.save(histories);

        }

        return {
            success: true,
            message: `Updated order status for group and ${orderIds.length} orders`,
            data: {
                groupOrderId,
                order_status: orderStatus,
                status_text: this.getOrderStatusText(orderStatus),
                updated_orders_count: orderIds.length,
            },
        };
    }




    async leaveGroupOrder(groupId: number, userId: number) {
        // 1. Kiểm tra group tồn tại và đang mở
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['user', 'members', 'members.user']
        });

        if (!group) {
            throw new NotFoundException('Group order not found');
        }

        if (group.status !== 'open') {
            throw new BadRequestException('Không thể rời nhóm khi nhóm đã bị khóa hoặc đã hoàn thành');
        }

        // 2. Kiểm tra user có phải host không (host không được rời)
        if (group.user.id === userId) {
            throw new BadRequestException('Chủ nhóm không thể rời nhóm. Vui lòng xóa nhóm nếu muốn hủy.');
        }

        // 3. Tìm member
        const member = await this.memberRepo.findOne({
            where: {
                group_order: { id: groupId } as any,
                user: { id: userId } as any,
            },
            relations: ['user'],
        });

        if (!member) {
            throw new NotFoundException('Bạn chưa tham gia nhóm này');
        }

        // 4. Xóa tất cả items của member này
        const memberItems = await this.groupOrderItemRepo.find({
            where: {
                group_order: { id: groupId } as any,
                member: { id: member.id } as any,
            },
        });

        if (memberItems.length > 0) {
            await this.groupOrderItemRepo.delete(
                memberItems.map(item => item.id)
            );

            // Broadcast xóa items
            for (const item of memberItems) {
                await this.gateway.broadcastGroupUpdate(groupId, 'item-removed', {
                    itemId: item.id,
                });
            }
        }

        // 5. Xóa member khỏi group
        await this.memberRepo.delete({ id: member.id });

        // 6. Cập nhật lại discount của group (vì số member giảm)
        await this.groupOrderItemsService.updateGroupDiscount(groupId);

        // 7. Broadcast cho các thành viên khác biết
        await this.gateway.broadcastGroupUpdate(groupId, 'member-left', {
            userId,
            memberId: member.id,
        });

        return {
            success: true,
            message: 'Đã rời nhóm thành công',
        };
    }

    // // THÊM METHOD MỚI (private helper):
    // private async autoLockIfReachedTarget(groupId: number) {
    //     const group = await this.groupOrderRepo.findOne({
    //         where: { id: groupId },
    //         relations: ['members', 'store'],
    //     });

    //     if (!group) return;

    //     // Chỉ lock nếu đang ở trạng thái open
    //     if (group.status !== 'open') return;

    //     // Không có target → không auto lock
    //     if (!group.target_member_count) return;

    //     // Đếm số thành viên active
    //     const activeMembers = group.members.filter(
    //         (m) => m.status === 'joined' || m.status === 'ordered'
    //     );

    //     console.log(
    //         `Group #${groupId}: ${activeMembers.length}/${group.target_member_count} members`
    //     );

    //     // Nếu đủ số lượng → TỰ ĐỘNG KHÓA
    //     if (activeMembers.length >= group.target_member_count) {
    //         // Validate: Tất cả members phải có items
    //         const items = await this.groupOrderItemRepo.find({
    //             where: { group_order: { id: groupId } },
    //             relations: ['member'],
    //         });

    //         const memberIdsWithItems = new Set(items.map((it) => it.member.id));
    //         const membersWithoutItems = activeMembers.filter(
    //             (m) => !memberIdsWithItems.has(m.id)
    //         );

    //         if (membersWithoutItems.length > 0) {
    //             // Có member chưa chọn SP → broadcast cảnh báo
    //             await this.gateway.broadcastGroupUpdate(
    //                 groupId,
    //                 'target-reached-warning',
    //                 {
    //                     groupId,
    //                     message:
    //                         '⚠️ Đã đủ số lượng thành viên! Vui lòng chọn sản phẩm để nhóm có thể khóa.',
    //                     membersWithoutItems: membersWithoutItems.map((m) => ({
    //                         id: m.id,
    //                         name: m.user?.profile?.full_name || m.user?.username,
    //                     })),
    //                 }
    //             );
    //             return;
    //         }

    //         // Validate địa chỉ nếu member_address mode
    //         if (group.delivery_mode === 'member_address') {
    //             const membersWithoutAddress = activeMembers.filter(
    //                 (m) => !m.address_id
    //             );
    //             if (membersWithoutAddress.length > 0) {
    //                 await this.gateway.broadcastGroupUpdate(
    //                     groupId,
    //                     'target-reached-warning',
    //                     {
    //                         groupId,
    //                         message: '⚠️ Đã đủ số lượng! Vui lòng chọn địa chỉ giao hàng.',
    //                         membersWithoutAddress: membersWithoutAddress.map((m) => ({
    //                             id: m.id,
    //                             name: m.user?.profile?.full_name || m.user?.username,
    //                         })),
    //                     }
    //                 );
    //                 return;
    //             }
    //         }

    //         //  TẤT CẢ OK → KHÓA NHÓM
    //         await this.groupOrderRepo.update(groupId, { status: 'locked' });

    //         await this.gateway.broadcastGroupUpdate(groupId, 'group-auto-locked', {
    //             groupId,
    //             message: `🔒 Nhóm đã đủ ${group.target_member_count} người và tự động khóa! Mỗi thành viên hãy thanh toán phần của mình.`,
    //             targetCount: group.target_member_count,
    //         });

    //         console.log(
    //             `🔒 Group #${groupId} auto-locked (reached ${group.target_member_count} members)`
    //         );
    //     }
    // }

    // THÊM: Member thanh toán riêng phần của mình
    async checkoutMemberItems(
        groupId: number,
        userId: number,
        paymentMethodUuid: string,
        addressId?: number,
        voucherCode?: string
    ) {
        // 1. Validate group
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['store', 'user', 'members', 'members.user', 'members.address_id'],
        });

        if (!group) throw new NotFoundException('Group order not found');

        if (group.delivery_mode === 'member_address') {
            const paymentMethod = await this.paymentsService['methodsRepo'].findOne({
                where: { uuid: paymentMethodUuid }
            });

            if (!paymentMethod) {
                throw new BadRequestException('Phương thức thanh toán không hợp lệ');
            }

            if (paymentMethod.type === 'cod') {
                throw new BadRequestException(
                    'Chế độ giao hàng riêng yêu cầu thanh toán online trước. Vui lòng chọn phương thức khác!'
                );
            }
        }

        //  CHỈ CHO PHÉP THANH TOÁN KHI NHÓM ĐÃ LOCKED
        if (group.status !== 'locked') {
            throw new BadRequestException(
                'Nhóm chưa được khóa. Hãy đợi đủ số lượng thành viên hoặc host khóa nhóm!'
            );
        }

        // 2. Tìm member
        const member = group.members.find((m) => m.user.id === userId);
        if (!member) {
            throw new BadRequestException('Bạn không phải thành viên của nhóm này');
        }

        if (member.has_paid) {
            throw new BadRequestException('Bạn đã thanh toán rồi!');
        }

        if (voucherCode && voucherCode.trim()) {
            if (group.user.id !== userId) {
                throw new ForbiddenException(
                    'Chỉ host mới có thể áp dụng voucher cho nhóm mua.'
                );
            }
        }

        // 3. Lấy items của member này
        const myItems = await this.groupOrderItemRepo.find({
            where: {
                group_order: { id: groupId },
                member: { id: member.id },
            },
            relations: ['product', 'variant'],
        });

        if (!myItems.length) {
            throw new BadRequestException('Bạn chưa chọn sản phẩm nào');
        }

        // 4. Xác định địa chỉ giao hàng
        let deliveryAddress!: UserAddress;

        if (group.delivery_mode === 'member_address') {
            // Member phải có địa chỉ riêng
            if (!member.address_id) {
                throw new BadRequestException('Vui lòng chọn địa chỉ giao hàng của bạn');
            }
            deliveryAddress = member.address_id;
        } else {
            // host_address: dùng địa chỉ của host
            if (!addressId) {
                // Lấy địa chỉ default của host
                const hostAddresses = await this.userAddressRepo.find({
                    where: { user: { id: group.user.id } },
                    order: { isDefault: 'DESC' },
                });
                if (!hostAddresses.length) {
                    throw new BadRequestException('Host chưa có địa chỉ giao hàng');
                }
                deliveryAddress = hostAddresses[0];
            } else {
                const foundAddress = await this.userAddressRepo.findOne({
                    where: { id: addressId, user: { id: group.user.id } },
                });
                if (!foundAddress) {
                    throw new BadRequestException('Địa chỉ không hợp lệ');
                }
                deliveryAddress = foundAddress;
            }
        }
        // 5. Tính tiền
        const subtotal = myItems.reduce((sum, it) => sum + Number(it.price || 0), 0);
        const shippingFee = 0;

        //  XỬ LÝ VOUCHER
        let discountTotal = 0;
        let appliedVoucher: Voucher | null = null;

        if (voucherCode && voucherCode.trim() && group.user.id === userId) {
            try {
                // Lấy TẤT CẢ items trong nhóm
                const allGroupItems = await this.groupOrderItemRepo.find({
                    where: { group_order: { id: groupId } },
                    relations: ['product', 'variant'],
                });

                const totalGroupValue = allGroupItems.reduce(
                    (sum, it) => sum + Number(it.price || 0),
                    0
                );

                // Validate voucher với toàn bộ nhóm
                const orderItems = allGroupItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: Number(item.price),
                }));

                const validation = await this.vouchersService.validateVoucher(
                    voucherCode.trim(),
                    userId,
                    orderItems,
                    group.store.id
                );

                appliedVoucher = validation.voucher;

                // ✨ KIỂM TRA: Chỉ cho phép PLATFORM và STORE voucher
                if (
                    appliedVoucher.type !== VoucherType.PLATFORM &&
                    appliedVoucher.type !== VoucherType.STORE
                ) {
                    throw new BadRequestException(
                        `Mua nhóm chỉ được áp dụng voucher PLATFORM hoặc STORE. Voucher này là loại ${this.getVoucherTypeName(appliedVoucher.type)}.`
                    );
                }

                // ✨ KIỂM TRA THÊM: Nếu là STORE voucher
                if (appliedVoucher.type === VoucherType.STORE) {
                    if (appliedVoucher.store?.id !== group.store.id) {
                        throw new BadRequestException(
                            'Voucher STORE này không áp dụng cho cửa hàng của nhóm mua này.'
                        );
                    }
                }

                const totalDiscount = Number(validation.discount);

                // Phân bổ discount cho member này theo tỷ lệ
                const ratio = subtotal / totalGroupValue;
                discountTotal = Math.floor(totalDiscount * ratio);

                this.logger.log(
                    ` Host voucher: Total ${totalDiscount}đ, Member ${userId} ratio ${(ratio * 100).toFixed(2)}%, discount ${discountTotal}đ`
                );

                // Lưu voucher info để các members khác biết
                await this.saveGroupVoucherInfo(groupId, {
                    voucherCode: appliedVoucher.code,
                    voucherId: appliedVoucher.id,
                    voucherType: appliedVoucher.type,
                    totalDiscount: totalDiscount,
                    totalGroupValue: totalGroupValue,
                    appliedBy: userId,
                    appliedAt: new Date(),
                });

            } catch (err: any) {
                const errorMsg = err instanceof BadRequestException
                    ? err.message
                    : `Voucher không hợp lệ: ${err.message}`;
                throw new BadRequestException(errorMsg);
            }
        } else if (!voucherCode || !voucherCode.trim()) {
            // Member khác host → đọc voucher info từ cache
            const voucherInfo = await this.getGroupVoucherInfo(groupId);

            if (voucherInfo) {
                const ratio = subtotal / voucherInfo.totalGroupValue;
                discountTotal = Math.floor(voucherInfo.totalDiscount * ratio);

                this.logger.log(
                    `📊 Member ${userId} auto-applying voucher ${voucherInfo.voucherCode}: discount ${discountTotal}đ`
                );

                appliedVoucher = { code: voucherInfo.voucherCode } as Voucher;
            }
        }

        const totalAmount = Math.max(0, subtotal + shippingFee - discountTotal);

        // 6. Tạo Order cho member này
        const order = this.orderRepo.create({
            user: { id: userId },
            store: { id: group.store.id },
            userAddress: deliveryAddress,
            subtotal,
            shippingFee,
            discountTotal,
            totalAmount,
            status: group.delivery_mode === 'member_address'
                ? OrderStatuses.waiting_group
                : OrderStatuses.pending,
            group_order: { id: groupId },
        });

        const savedOrder = await this.orderRepo.save(order);

        // 7. Tạo OrderItems
        const orderItems = myItems.map((gi) =>
            this.orderItemsRepo.create({
                order: { id: savedOrder.id },
                product: { id: gi.product.id },
                variant: gi.variant ? { id: gi.variant.id } : null,
                quantity: gi.quantity,
                price: gi.price,
                groupOrderItem: { id: gi.id },
            })
        );
        await this.orderItemsRepo.save(orderItems);

        if (appliedVoucher && group.user.id === userId) {
            try {
                const voucherInfo = await this.getGroupVoucherInfo(groupId);
                if (voucherInfo) {
                    await this.vouchersService.applyVoucher(
                        voucherInfo.voucherId,
                        userId,
                        savedOrder
                    );
                    this.logger.log(
                        `✅ Applied voucher ${voucherInfo.voucherCode} to host's order #${savedOrder.id}`
                    );
                }
            } catch (err: any) {
                this.logger.error(`❌ Failed to apply voucher: ${err.message}`);
            }
        }

        // 8. Tạo Payment
        const payment = await this.paymentsService.create({
            orderUuid: savedOrder.uuid,
            paymentMethodUuid: paymentMethodUuid,
            amount: totalAmount,
        });

        // 9. Cập nhật member status
        await this.memberRepo.update(member.id, {
            order: { id: savedOrder.id },
        });


        console.log(`💳 Member ${userId} paid for group #${groupId}`);

        return {
            message: 'Thanh toán thành công',
            orderUuid: savedOrder.uuid,
            order: savedOrder,
            voucherDiscount: discountTotal > 0 ? {
                amount: discountTotal,
                code: appliedVoucher?.code,
                note: group.user.id === userId
                    ? 'Bạn (host) đã áp dụng voucher cho cả nhóm'
                    : 'Discount được phân bổ từ voucher của host',
            } : null,
            redirectUrl: typeof payment === 'object' && 'redirectUrl' in payment
                ? payment.redirectUrl
                : null,
        };
    }

    //  THÊM: Helper kiểm tra và hoàn thành nhóm
    private async checkAndCompleteGroup(groupId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['members', 'members.user', 'orders', 'user'],
        });

        if (!group || group.status !== 'locked') return;

        const activeMembers = group.members.filter((m) => m.status !== 'left');

        let shouldComplete = false;
        let completionMessage = '';

        if (group.delivery_mode === 'host_address') {
            //    HOST_ADDRESS MODE: Chỉ cần HOST thanh toán là xong
            const hostMember = activeMembers.find(m => m.user.id === group.user.id);

            if (hostMember && hostMember.has_paid) {
                shouldComplete = true;
                completionMessage = ' Host đã thanh toán! Đơn hàng hoàn thành.';
                this.logger.log(` Host paid for group #${groupId} (host_address mode)`);
            }
        } else {

            const allPaid = activeMembers.every((m) => m.has_paid);

            if (allPaid) {

                const orderIds = (group.orders || []).map(o => o.id);

                if (orderIds.length > 0) {
                    await this.orderRepo
                        .createQueryBuilder()
                        .update()
                        .set({ status: OrderStatuses.pending })
                        .where('id IN (:...orderIds)', { orderIds })
                        .andWhere('status = :waitingStatus', {
                            waitingStatus: OrderStatuses.waiting_group
                        })
                        .execute();

                    console.log(` Updated ${orderIds.length} orders to CONFIRMED`);
                }
                //  Chuyển status → COMPLETED
                await this.groupOrderRepo.update(groupId, {
                    status: 'completed',
                    order_status: OrderStatuses.confirmed, // Xác nhận để giao hàng
                });

                await this.gateway.broadcastGroupUpdate(groupId, 'group-completed', {
                    groupId,
                    message:
                        '🎉 Tất cả đã thanh toán thành công! Đơn nhóm được xác nhận để giao hàng.',
                });

                console.log(` Group #${groupId} completed - all members paid`);
            } else {
                // Broadcast tiến độ thanh toán
                const paidCount = activeMembers.filter((m) => m.has_paid).length;
                await this.gateway.broadcastGroupUpdate(groupId, 'payment-progress', {
                    groupId,
                    paidCount,
                    totalCount: activeMembers.length,
                    message: `${paidCount}/${activeMembers.length} thành viên đã thanh toán`,
                });
            }
        }
        if (shouldComplete) {
            await this.groupOrderRepo.update(groupId, {
                status: 'completed',
                order_status: OrderStatuses.confirmed,
            });

            await this.gateway.broadcastGroupUpdate(groupId, 'group-completed', {
                groupId,
                message: completionMessage || '🎉 Đơn nhóm đã thanh toán xong!',
            });

            this.logger.log(`Group #${groupId} completed (host_address flow)`);
        }
    }

    //  THÊM: Host khóa nhóm thủ công
    async manualLockGroup(groupId: number, userId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['user', 'members', 'members.user', 'members.address_id'],
        });

        if (!group) throw new NotFoundException('Group order not found');

        // Chỉ host mới được khóa
        if (group.user.id !== userId) {
            throw new ForbiddenException('Chỉ host mới có thể khóa nhóm');
        }

        if (group.status !== 'open') {
            throw new BadRequestException('Nhóm không ở trạng thái mở');
        }

        // Validate: Phải có ít nhất 2 thành viên (bao gồm host)
        const activeMembers = group.members.filter(
            (m) => m.status === 'joined' || m.status === 'ordered'
        );

        if (activeMembers.length < 2) {
            throw new BadRequestException('Cần ít nhất 2 thành viên để khóa nhóm');
        }

        // Validate: Tất cả members phải có items
        const items = await this.groupOrderItemRepo.find({
            where: { group_order: { id: groupId } },
            relations: ['member'],
        });

        const memberIdsWithItems = new Set(items.map((it) => it.member.id));
        const membersWithoutItems = activeMembers.filter(
            (m) => !memberIdsWithItems.has(m.id)
        );

        if (membersWithoutItems.length > 0) {
            const names = membersWithoutItems
                .map(
                    (m) =>
                        m.user?.profile?.full_name ||
                        m.user?.username ||
                        `User ${m.user?.id}`
                )
                .join(', ');
            throw new BadRequestException(
                `Không thể khóa: Các thành viên sau chưa chọn sản phẩm: ${names}`
            );
        }

        // Validate địa chỉ nếu member_address mode
        if (group.delivery_mode === 'member_address') {
            const membersWithoutAddress = activeMembers.filter((m) => !m.address_id);
            if (membersWithoutAddress.length > 0) {
                const names = membersWithoutAddress
                    .map(
                        (m) =>
                            m.user?.profile?.full_name ||
                            m.user?.username ||
                            `User ${m.user?.id}`
                    )
                    .join(', ');
                throw new BadRequestException(
                    `Không thể khóa: Các thành viên sau chưa chọn địa chỉ giao hàng: ${names}`
                );
            }
        }

        await this.groupOrderRepo.update(groupId, { status: 'locked' });

        await this.gateway.broadcastGroupUpdate(groupId, 'group-manual-locked', {
            groupId,
            message: `🔒 Host đã khóa nhóm với ${activeMembers.length} thành viên. Mỗi người hãy thanh toán phần của mình!`,
            memberCount: activeMembers.length,
            lockedBy: 'host',
        });

        console.log(
            `🔒 Group #${groupId} manually locked by host (${activeMembers.length} members)`
        );

        return {
            message: `Đã khóa nhóm với ${activeMembers.length} thành viên`,
            memberCount: activeMembers.length,
            targetCount: group.target_member_count,
        };
    }


    async unlockGroupOrder(groupId: number, userId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId },
            relations: ['user', 'members'],
        });

        if (!group) throw new NotFoundException('Group order not found');

        // Chỉ host mới được unlock
        if (group.user.id !== userId) {
            throw new ForbiddenException('Chỉ host mới có thể mở khóa nhóm');
        }

        if (group.status !== 'locked') {
            throw new BadRequestException('Nhóm không ở trạng thái khóa');
        }

        // ✅ KIỂM TRA: Chỉ cho unlock nếu CHƯA AI THANH TOÁN
        const hasPaidMember = group.members.some((m) => m.has_paid);
        if (hasPaidMember) {
            throw new BadRequestException(
                'Không thể mở khóa: Đã có thành viên thanh toán!'
            );
        }

        // Unlock
        await this.groupOrderRepo.update(groupId, { status: 'open' });

        await this.gateway.broadcastGroupUpdate(groupId, 'group-unlocked', {
            groupId,
            message: '🔓 Host đã mở khóa nhóm. Có thể tiếp tục chỉnh sửa.',
        });

        console.log(`🔓 Group #${groupId} unlocked by host`);

        return {
            message: 'Đã mở khóa nhóm',
            status: 'open',
        };
    }

    async handleMemberPaid(groupOrderId: number, userId: number) {
        this.logger.log(
            `🔔 Handling member paid: Group #${groupOrderId}, User #${userId}`
        );

        // 1. Load member với user info
        const member = await this.memberRepo.findOne({
            where: {
                group_order: { id: groupOrderId } as any,
                user: { id: userId } as any,
            },
            relations: ['user', 'user.profile'],
        });

        if (!member) {
            this.logger.warn(
                `⚠️ Member not found for group #${groupOrderId}, user #${userId}`
            );
            return;
        }

        // 2. Broadcast member-paid event
        try {
            await this.gateway.broadcastGroupUpdate(groupOrderId, 'member-paid', {
                userId,
                memberName: member.user?.profile?.full_name || member.user?.username,
                memberId: member.id,
            });
            const group = await this.groupOrderRepo.findOne({
                where: { id: groupOrderId },
                relations: ['members'],
            });
            if (group) {
                const totalMembers = group.members.length;
                const paidMembers = group.members.filter(m => m.has_paid).length;

                await this.gateway.broadcastGroupUpdate(groupOrderId, 'payment-progress', {
                    totalMembers,
                    paidMembers,
                    progress: Math.round((paidMembers / totalMembers) * 100),
                });
            }

            this.logger.log(
                ` Broadcasted member-paid event for member #${member.id}`
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Failed to broadcast member-paid event: ${errorMessage}`
            );
        }

        // 3. Kiểm tra và complete group nếu tất cả đã thanh toán
        try {
            await this.checkAndCompleteGroup(groupOrderId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Failed to check and complete group #${groupOrderId}: ${errorMessage}`
            );
        }

        this.logger.log(
            ` Completed handling member paid for group #${groupOrderId}`
        );
    }

    private getVoucherTypeName(type: VoucherType): string {
        const typeNames = {
            [VoucherType.SHIPPING]: 'SHIPPING',
            [VoucherType.PRODUCT]: 'PRODUCT',
            [VoucherType.STORE]: 'STORE',
            [VoucherType.CATEGORY]: 'CATEGORY',
            [VoucherType.PLATFORM]: 'PLATFORM',
        };
        return typeNames[type] || 'UNKNOWN';
    }
    private groupVoucherCache = new Map<number, any>();

    private async saveGroupVoucherInfo(groupId: number, info: any) {
        this.groupVoucherCache.set(groupId, info);

        // Auto-clear sau 1 giờ
        setTimeout(() => {
            this.groupVoucherCache.delete(groupId);
        }, 3600000);
    }

    private async getGroupVoucherInfo(groupId: number) {
        return this.groupVoucherCache.get(groupId) || null;
    }

    private async markRefundedForCancelledGroup(groupId: number) {
        const group = await this.groupOrderRepo.findOne({
            where: { id: groupId } as any,
            relations: ['members'],
        });

        if (!group) return;

        // Chỉ áp dụng cho mode giao từng member
        if (group.delivery_mode !== 'member_address') return;
        if (!Array.isArray(group.members) || !group.members.length) return;

        const paidMemberIds = group.members
            .filter((m) => m.has_paid)
            .map((m) => m.id);

        if (!paidMemberIds.length) return;

        await this.memberRepo
            .createQueryBuilder()
            .update(GroupOrderMember)
            .set({ status: 'refunded' })
            .whereInIds(paidMemberIds)
            .execute();

        this.logger.log(
            `Marked ${paidMemberIds.length} group members as refunded for cancelled group #${groupId}`,
        );
    }

}



