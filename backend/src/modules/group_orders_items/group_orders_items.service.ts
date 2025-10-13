import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrderItem } from './group_orders_item.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { CreateGroupOrderItemDto } from './dto/create-group-order-item.dto';
import { UpdateGroupOrderItemDto } from './dto/update-group-order-item.dto';


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
			where: { group_order: { id: groupId }, user: { id: userId }, status: 'joined' },
			relations: ['group_order', 'user'],
		});
		if (!member)
			throw new BadRequestException('Người dùng chưa tham gia group hoặc không hợp lệ');
		return member;
	}

	// Hàm tính giá sản phẩm giống logic order
	private async calculateItemPrice(productId: number, variantId?: number, quantity = 1): Promise<number> {
		const product = await this.productRepo.findOne({ where: { id: productId } });
		if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

		let variant: Variant | null = null;
		let basePrice: number;

		if (variantId) {
			variant = await this.variantRepo.findOne({
				where: { id: variantId, product: { id: productId } },
			});
			if (!variant)
				throw new BadRequestException('Biến thể không hợp lệ cho sản phẩm này');

			// ✅ SỬA: Ưu tiên variant price, chỉ fallback về product base_price nếu variant price không hợp lệ
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

		return basePrice;
	}

	// Thêm sản phẩm vào group
	async addItem(groupId: number, dto: CreateGroupOrderItemDto & { userId: number }) {
		const group = await this.ensureGroupOpen(groupId);
		const member = await this.ensureMember(groupId, dto.userId);

		// 💰 Tính đơn giá theo logic order
		let unitPrice = await this.calculateItemPrice(dto.productId, dto.variantId, dto.quantity);

		// Nếu group có discount riêng (ví dụ giảm 5%)
		if (group.discount_percent && group.discount_percent > 0) {
			unitPrice = unitPrice * (1 - group.discount_percent / 100);
		}

		const item = this.itemRepo.create({
			group_order: { id: groupId } as GroupOrder,
			member: { id: member.id } as GroupOrderMember,
			product: { id: dto.productId } as Product,
			variant: dto.variantId ? ({ id: dto.variantId } as Variant) : null,
			quantity: dto.quantity,
			price: unitPrice * dto.quantity,
			note: dto.note ?? null,
		});

		return await this.itemRepo.save(item);
	}

	// Danh sách tất cả item trong group
	async listGroupItems(groupId: number) {
		return this.itemRepo.find({
			where: { group_order: { id: groupId } },
			relations: ['member', 'member.user', 'product', 'variant'],
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
	async updateItem(groupId: number, itemId: number, dto: UpdateGroupOrderItemDto, userId: number) {
		await this.ensureGroupOpen(groupId);

		const item = await this.itemRepo.findOne({
			where: { id: itemId, group_order: { id: groupId } },
			relations: ['member', 'member.user'],
		});
		if (!item) throw new NotFoundException('Item không tồn tại trong group này');
		if (item.member?.user?.id !== userId)
			throw new BadRequestException('Không có quyền sửa item của người khác');

		if (dto.quantity !== undefined) {
			if (dto.quantity < 1)
				throw new BadRequestException('Số lượng tối thiểu là 1');
			item.quantity = dto.quantity;
			// Tính lại giá nếu thay đổi số lượng
			const unitPrice = await this.calculateItemPrice(item.product.id, item.variant?.id, dto.quantity);
			item.price = unitPrice * dto.quantity;
		}

		if (dto.note !== undefined) {
			item.note = dto.note ?? null;
		}

		return await this.itemRepo.save(item);
	}

	// Xóa item (chỉ chủ sở hữu)
	async removeItem(groupId: number, itemId: number, userId: number) {
		await this.ensureGroupOpen(groupId);
		const item = await this.itemRepo.findOne({
			where: { id: itemId, group_order: { id: groupId } },
			relations: ['member', 'member.user'],
		});
		if (!item) throw new NotFoundException('Item không tồn tại trong group này');
		if (item.member?.user?.id !== userId)
			throw new BadRequestException('Không có quyền xoá item của người khác');

		await this.itemRepo.delete(item.id);
		return { success: true };
	}
}
