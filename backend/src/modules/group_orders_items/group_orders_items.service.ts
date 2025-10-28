import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrderItem } from './group_orders_item.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { CreateGroupOrderItemDto } from './dto/create-group-order-item.dto';
import { UpdateGroupOrderItemDto } from './dto/update-group-order-item.dto';
import { Inject, forwardRef } from '@nestjs/common';
import { GroupOrdersGateway } from '../group_orders/group_orders.gateway';
import { Inventory } from '../inventory/inventory.entity';

@Injectable()
export class GroupOrderItemsService {
	constructor(
		@InjectRepository(GroupOrder)
		private readonly groupOrderRepo: Repository<GroupOrder>,
		@InjectRepository(GroupOrderMember)
		private readonly memberRepo: Repository<GroupOrderMember>,
		@InjectRepository(GroupOrderItem)
		private readonly itemRepo: Repository<GroupOrderItem>,
		@InjectRepository(Product)
		private readonly productRepo: Repository<Product>,
		@InjectRepository(Variant)
		private readonly variantRepo: Repository<Variant>,
		@InjectRepository(PricingRules)
		private readonly pricingRulesRepo: Repository<PricingRules>,
		@Inject(forwardRef(() => GroupOrdersGateway))
		private readonly gateway: GroupOrdersGateway,
		@InjectRepository(Inventory)
		private readonly inventoryRepo: Repository<Inventory>
	) { }

	// Kiểm tra group còn mở
	private async ensureGroupOpen(groupId: number) {
		const group = await this.groupOrderRepo.findOne({ where: { id: groupId } });
		if (!group) throw new NotFoundException('Group order không tồn tại');
		if (group.status !== 'open')
			throw new BadRequestException('Group order không ở trạng thái mở');
		return group;
	}

	// Kiểm tra người dùng có trong group
	private async ensureMember(groupId: number, userId: number) {
		const member = await this.memberRepo.findOne({
			where: {
				group_order: { id: groupId },
				user: { id: userId },
				status: 'joined',
			},
			relations: ['group_order', 'user'],
		});
		if (!member)
			throw new BadRequestException(
				'Người dùng chưa tham gia group hoặc không hợp lệ'
			);
		return member;
	}

	private calculateDiscountPercent(memberCount: number): number {
		if (memberCount >= 8) return 10;
		if (memberCount >= 5) return 6;
		if (memberCount >= 3) return 4;
		if (memberCount >= 2) return 2;
		return 0;
	}

	// Hàm tính giá sản phẩm giống logic order
	private async calculateItemPrice(
		productId: number,
		variantId?: number,
		quantity = 1,
		groupId?: number
	): Promise<{ basePrice: number; finalPrice: number; discountPercent: number }> {

		const product = await this.productRepo.findOne({
			where: { id: productId },
		});
		if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

		let variant: Variant | null = null;
		let basePrice: number;

		if (variantId) {
			variant = await this.variantRepo.findOne({
				where: { id: variantId, product: { id: productId } },
			});
			if (!variant)
				throw new BadRequestException('Biến thể không hợp lệ cho sản phẩm này');

			// SỬA: Ưu tiên variant price, chỉ fallback về product base_price nếu variant price không hợp lệ
			if (variant.price && Number(variant.price) > 0) {
				basePrice = Number(variant.price);
			} else {
				// Nếu variant không có price hoặc price = 0, dùng product base_price
				basePrice = Number(product.base_price);
			}
		} else {
			// Không có variant, dùng product base_price
			basePrice = Number(product.base_price);
		}

		if (!basePrice || basePrice <= 0)
			throw new BadRequestException('Không xác định được đơn giá hợp lệ');

		// 3. KIỂM TRA TỒN KHO
		const inventory = await this.inventoryRepo.findOne({
			where: {
				product: { id: productId },
				variant: variantId ? { id: variantId } : IsNull(),
			},
		});

		if (!inventory) {
			throw new BadRequestException(
				`Không tìm thấy kho cho sản phẩm #${productId}`
			);
		}

		// Tính số lượng có sẵn
		const { available } = await this.inventoryRepo
			.createQueryBuilder('inv')
			.select(
				'COALESCE(SUM(inv.quantity - COALESCE(inv.used_quantity, 0)), 0)',
				'available'
			)
			.where('inv.variant_id = :variantId', {
				variantId: variantId ?? null,
			})
			.andWhere('inv.product_id = :productId', { productId })
			.getRawOne();

		if (Number(available) < quantity) {
			throw new BadRequestException(
				`Không đủ hàng trong kho. Có sẵn: ${available}, Yêu cầu: ${quantity}`
			);
		}

		// Tìm rule phù hợp
		const now = new Date();
		const pricingRules = await this.pricingRulesRepo
			.createQueryBuilder('rule')
			.where('rule.product_id = :productId', { productId })
			.andWhere('(rule.variant_id IS NULL OR rule.variant_id = :variantId)', {
				variantId: variantId ?? null,
			})
			.andWhere('rule.min_quantity <= :quantity', { quantity })
			.andWhere('rule.starts_at <= :now', { now })
			.andWhere('rule.ends_at >= :now', { now })
			.orderBy('rule.min_quantity', 'DESC')
			.getMany();

		let appliedRule: PricingRules | null = null;

		// Lọc rules theo type
		for (const rule of pricingRules) {
			if (rule.type === 'group') {
				appliedRule = rule;
				break;
			} else if (rule.type === 'bulk') {
				appliedRule = rule;
				break;
			}
		}

		if (appliedRule) {
			basePrice = Number(appliedRule.price);
		}

		let finalPrice = basePrice;
		let discountPercent = 0;
		// Áp dụng giảm giá theo số thành viên trong group
		if (groupId) {
			const group = await this.groupOrderRepo.findOne({
				where: { id: groupId },
				relations: ['members'],
			});

			if (group) {
				const memberCount = group.members?.length || 0;
				discountPercent = this.calculateDiscountPercent(memberCount);

				if (discountPercent > 0) {
					finalPrice = basePrice * (1 - discountPercent / 100);
				}
			}
		}

		return { basePrice, finalPrice, discountPercent };
	}

	// Thêm sản phẩm vào group
	async addItem(
		groupId: number,
		dto: CreateGroupOrderItemDto & { userId: number }
	) {
		const group = await this.ensureGroupOpen(groupId);
		const member = await this.ensureMember(groupId, dto.userId);


		// 💰 Tính đơn giá theo logic order
		const { basePrice, finalPrice, discountPercent } = await this.calculateItemPrice(
			dto.productId,
			dto.variantId,
			dto.quantity,
			groupId
		);

		const item = this.itemRepo.create({
			group_order: { id: groupId } as GroupOrder,
			member: { id: member.id } as GroupOrderMember,
			product: { id: dto.productId } as Product,
			variant: dto.variantId ? ({ id: dto.variantId } as Variant) : null,
			quantity: dto.quantity,
			price: finalPrice * dto.quantity, // ✅ finalPrice là number
			note: dto.note ?? null,
		});


		const saved = await this.itemRepo.save(item);
		const full = await this.itemRepo.findOne({
			where: { id: saved.id },
			relations: ['member', 'member.user', 'product', 'variant'],
		});
		await this.gateway.broadcastGroupUpdate(groupId, 'item-added', {
			item: full,
		});
		return full;
	}
	// Cập nhật discount của group dựa trên số thành viên
	async updateGroupDiscount(groupId: number) {
		const group = await this.groupOrderRepo.findOne({
			where: { id: groupId },
			relations: ['members'],
		});

		if (!group) return;

		const memberCount = group.members?.length || 0;
		const discountPercent = this.calculateDiscountPercent(memberCount);

		await this.groupOrderRepo.update(groupId, {
			discount_percent: discountPercent,
		});

		// Broadcast cập nhật discount
		await this.gateway.broadcastGroupUpdate(groupId, 'discount-updated', {
			discountPercent,
			memberCount,
		});

		return discountPercent;
	}

	// Danh sách tất cả item trong group
	async listGroupItems(groupId: number) {
		return this.itemRepo.find({
			where: { group_order: { id: groupId } },
			relations: [
				'member',
				'member.user',
				'product',
				'variant',
				'member.user.profile',
				'member.address_id',
			],
			order: { id: 'DESC' },
		});
	}

	// Danh sách item của 1 thành viên trong group
	async listMemberItems(groupId: number, memberId: number) {
		return this.itemRepo.find({
			where: { group_order: { id: groupId }, member: { id: memberId } },
			relations: ['member', 'member.user', 'product', 'variant'],
			order: { id: 'DESC' },
		});
	}

	// Cập nhật item (chỉ chủ sở hữu)
	async updateItem(
		groupId: number,
		itemId: number,
		dto: UpdateGroupOrderItemDto,
		userId: number
	) {
		await this.ensureGroupOpen(groupId);

		const item = await this.itemRepo.findOne({
			where: { id: itemId, group_order: { id: groupId } },
			relations: ['member', 'member.user'],
		});
		if (!item)
			throw new NotFoundException('Item không tồn tại trong group này');
		if (item.member?.user?.id !== userId)
			throw new BadRequestException('Không có quyền sửa item của người khác');

		if (dto.quantity !== undefined) {
			if (dto.quantity < 1)
				throw new BadRequestException('Số lượng tối thiểu là 1');
			item.quantity = dto.quantity;
			// Tính lại giá nếu thay đổi số lượng
			const { finalPrice } = await this.calculateItemPrice(
				item.product.id,
				item.variant?.id,
				dto.quantity,
				groupId
			);
			item.price = finalPrice * dto.quantity;

		}

		if (dto.note !== undefined) {
			item.note = dto.note ?? null;
		}

		const updated = await this.itemRepo.save(item);
		const full = await this.itemRepo.findOne({
			where: { id: updated.id },
			relations: ['member', 'member.user', 'product', 'variant'],
		});
		console.log('[WS] item-added emit', { groupId, id: full?.id });
		await this.gateway.broadcastGroupUpdate(groupId, 'item-updated', {
			item: full,
		});
		return full;
	}

	// Xóa item (chỉ chủ sở hữu)
	async removeItem(groupId: number, itemId: number, userId: number) {
		await this.ensureGroupOpen(groupId);
		const item = await this.itemRepo.findOne({
			where: { id: itemId, group_order: { id: groupId } },
			relations: ['member', 'member.user'],
		});
		if (!item)
			throw new NotFoundException('Item không tồn tại trong group này');
		if (item.member?.user?.id !== userId)
			throw new BadRequestException('Không có quyền xoá item của người khác');

		await this.itemRepo.delete(item.id);
		console.log('[WS] item-removed emit', { groupId, itemId });
		await this.gateway.broadcastGroupUpdate(groupId, 'item-removed', {
			itemId,
		});
		return { success: true };
	}
}
