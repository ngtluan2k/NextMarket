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
		groupId?: number,
		type?: 'bulk' | 'group' | 'flash_sale',
		pricingRuleId?: number
	): Promise<{ basePrice: number; finalPrice: number; discountPercent: number, appliedRule?: PricingRules | null  }> {

		const product = await this.productRepo.findOne({
			where: { id: productId },
			relations: ['pricing_rules', 'pricing_rules.variant'],
		});

		if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

		let variant: Variant | null = null;
		let basePrice: number;

		if (variantId) {
			variant = await this.variantRepo.findOne({
				where: { id: variantId, product: { id: productId } },
			});
			basePrice = variant?.price && variant.price > 0 ? Number(variant.price) : Number(product.base_price);
		} else {
			basePrice = Number(product.base_price);
		}

		if (!basePrice || basePrice <= 0)
			throw new BadRequestException('Không xác định được đơn giá hợp lệ');

		// KIỂM TRA TỒN KHO
		const { available } = await this.inventoryRepo
			.createQueryBuilder('inv')
			.select('COALESCE(SUM(inv.quantity - COALESCE(inv.used_quantity, 0)), 0)', 'available')
			.where('inv.product_id = :productId', { productId })
			.andWhere('inv.variant_id = :variantId', { variantId: variantId ?? null })
			.getRawOne();

		if (Number(available) < quantity)
			throw new BadRequestException(`Không đủ hàng trong kho. Có sẵn: ${available}, yêu cầu: ${quantity}`);

		const now = new Date();
		let appliedRule: PricingRules | null = null;

		if (pricingRuleId) {
			const directRule = (product.pricing_rules ?? []).find(r => r.id === pricingRuleId);
			if (directRule) {
				appliedRule = directRule;
				basePrice = Number(directRule.price);
			}
		}

		if (type === 'flash_sale') {
			// Lấy pricing rules flash_sale
			const rules = await this.pricingRulesRepo
				.createQueryBuilder('rule')
				.leftJoinAndSelect('rule.flashSaleSchedule', 'schedule') // giả sử relation
				.where('rule.product_id = :productId', { productId })
				.andWhere('(rule.variant_id IS NULL OR rule.variant_id = :variantId)', { variantId: variantId ?? null })
				.andWhere('rule.type = :type', { type: 'flash_sale' })
				.andWhere('schedule.starts_at <= :now AND schedule.ends_at >= :now', { now })
				.andWhere('rule.min_quantity <= :quantity', { quantity })
				.orderBy('rule.min_quantity', 'DESC')
				.getMany();

			if (rules.length > 0) {
				appliedRule = rules[0];
				basePrice = Number(appliedRule.price);
			}

		} else {
			// bulk / group
			const rules = await this.pricingRulesRepo
				.createQueryBuilder('rule')
				.where('rule.product_id = :productId', { productId })
				.andWhere('(rule.variant_id IS NULL OR rule.variant_id = :variantId)', { variantId: variantId ?? null })
				.andWhere('rule.type = :type', { type })
				.andWhere('rule.starts_at <= :now AND rule.ends_at >= :now', { now })
				.andWhere('rule.min_quantity <= :quantity', { quantity })
				.orderBy('rule.min_quantity', 'DESC')
				.getMany();

			if (rules.length > 0) {
				appliedRule = rules[0];
				basePrice = Number(appliedRule.price);
			}
		}

		let finalPrice = basePrice;
		let discountPercent = 0;

		if (groupId) {
			const group = await this.groupOrderRepo.findOne({ where: { id: groupId }, relations: ['members'] });
			if (group) {
				const memberCount = group.members?.length || 0;
				discountPercent = this.calculateDiscountPercent(memberCount);
				if (discountPercent > 0) {
					finalPrice = basePrice * (1 - discountPercent / 100);
				}
			}
		}
console.log('Calculated prices:', { basePrice, finalPrice, discountPercent, appliedRule });
		return { basePrice, finalPrice, discountPercent,appliedRule };
	}


	// Thêm sản phẩm vào group
	async addItem(
		groupId: number,
		dto: CreateGroupOrderItemDto & { userId: number , pricingRuleId?: number}
	) {
		const group = await this.ensureGroupOpen(groupId);
		const member = await this.ensureMember(groupId, dto.userId);


		//  Tính đơn giá theo logic order
		const { basePrice, finalPrice, discountPercent ,appliedRule} = await this.calculateItemPrice(
			dto.productId,
			dto.variantId,
			dto.quantity,
			groupId,
			'group',
			dto.pricingRuleId
		);

		const item = this.itemRepo.create({
			group_order: { id: groupId } as GroupOrder,
			member: { id: member.id } as GroupOrderMember,
			product: { id: dto.productId } as Product,
			variant: dto.variantId ? ({ id: dto.variantId } as Variant) : null,
			quantity: dto.quantity,
			price: finalPrice * dto.quantity, //  finalPrice là number
			note: dto.note ?? null,
			 pricing_rule: appliedRule ? ({ id: appliedRule.id } as PricingRules) : null,
		});


		const saved = await this.itemRepo.save(item);
		const full = await this.itemRepo.findOne({
			where: { id: saved.id },
			relations: ['member', 'member.user', 'product', 'variant','pricing_rule'],
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
		const oldDiscountPercent = Number(group.discount_percent || 0);
		const newDiscountPercent = this.calculateDiscountPercent(memberCount);

		// Nếu discount không đổi, không cần làm gì
		if (oldDiscountPercent === newDiscountPercent) {
			return newDiscountPercent;
		}

		// Cập nhật discount của group
		await this.groupOrderRepo.update(groupId, {
			discount_percent: newDiscountPercent,
		});

		//  TÍNH LẠI GIÁ CHO TẤT CẢ ITEMS CŨ
		if (newDiscountPercent !== oldDiscountPercent) {
			// Lấy tất cả items hiện tại
			const allItems = await this.itemRepo.find({
				where: { group_order: { id: groupId } },
				relations: ['product', 'variant'],
			});

			for (const item of allItems) {
				// Tính basePrice (giá gốc trước discount) từ price hiện tại
				let basePricePerUnit: number;

				if (oldDiscountPercent === 0) {
					// Item được tạo khi chưa có discount → price hiện tại = basePrice
					basePricePerUnit = Number(item.price) / item.quantity;
				} else {
					// Item được tạo khi đã có discount → tính ngược lại basePrice
					const factor = 1 - oldDiscountPercent / 100;
					basePricePerUnit = (Number(item.price) / item.quantity) / factor;
				}

				// Áp dụng discount mới
				const newFinalPricePerUnit = basePricePerUnit * (1 - newDiscountPercent / 100);
				const newTotalPrice = newFinalPricePerUnit * item.quantity;

				// Cập nhật giá trong DB
				await this.itemRepo.update(
					{ id: item.id },
					{ price: newTotalPrice }
				);

				// Broadcast cập nhật từng item để frontend cập nhật realtime
				const updatedItem = await this.itemRepo.findOne({
					where: { id: item.id },
					relations: ['member', 'member.user', 'product', 'variant', 'member.user.profile', 'member.address_id'],
				});

				if (updatedItem) {
					await this.gateway.broadcastGroupUpdate(groupId, 'item-updated', {
						item: updatedItem,
					});
				}
			}
		}

		// Broadcast cập nhật discount
		await this.gateway.broadcastGroupUpdate(groupId, 'discount-updated', {
			discountPercent: newDiscountPercent,
			memberCount,
		});

		return newDiscountPercent;
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
				'pricing_rule',
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
