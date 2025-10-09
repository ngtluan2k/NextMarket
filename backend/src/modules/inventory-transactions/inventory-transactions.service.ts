import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryTransaction,
  TransactionType,
} from './inventory-transaction.entity';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';
import { Variant } from '../variant/variant.entity';
import { Inventory } from '../inventory/inventory.entity';
import { User } from '../user/user.entity';

@Injectable()
export class InventoryTransactionService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  /** 🧾 Lấy tất cả giao dịch tồn kho */
  async findAll() {
    try {
      return await this.transactionRepo.find({
        relations: ['variant', 'variant.product', 'inventory', 'createdBy'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Không thể tải danh sách giao dịch tồn kho'
      );
    }
  }

  /** ➕ Thêm giao dịch tồn kho mới */
  async addInventoryTransaction(
    dto: CreateInventoryTransactionDto,
    userId: number
  ) {
    try {
      const variant = await this.variantRepo.findOne({
        where: { id: dto.variantId },
        relations: ['product'],
      });
      if (!variant)
        throw new NotFoundException('Không tìm thấy biến thể sản phẩm');

      const inventory =
        (await this.inventoryRepo.findOne({
          where: { id: dto.inventoryId },
          relations: ['variant', 'product'],
        })) ||
        this.inventoryRepo.create({
          product: variant.product,
          variant,
          location: 'default',
          quantity: 0,
          used_quantity: 0,
        });

      // Cập nhật số lượng tồn kho
      switch (dto.transactionType) {
        case TransactionType.IMPORT:
          inventory.quantity += dto.quantity;
          break;
        case TransactionType.EXPORT:
          if (inventory.quantity < dto.quantity) {
            throw new BadRequestException('Số lượng tồn không đủ để xuất');
          }
          inventory.quantity -= dto.quantity;
          break;
        case TransactionType.ADJUSTMENT:
          inventory.quantity += dto.quantity;
          break;
      }

      await this.inventoryRepo.save(inventory);

      // Gán người tạo
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');

      // Tạo giao dịch
      const transaction = this.transactionRepo.create({
        variant,
        inventory,
        quantity: dto.quantity,
        transactionType: dto.transactionType,
        note: dto.note,
        createdBy: user,
      });

      const savedTransaction = await this.transactionRepo.save(transaction);

      // Cập nhật tồn kho trong variant
      const total = await this.inventoryRepo
        .createQueryBuilder('inv')
        .select('SUM(inv.quantity)', 'sum')
        .where('inv.variant_id = :variantId', { variantId: variant.id })
        .getRawOne();

      await this.variantRepo.update(variant.id, { stock: total.sum || 0 });

      return savedTransaction;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      console.error('Error addInventoryTransaction:', error);
      throw new InternalServerErrorException('Thêm giao dịch tồn kho thất bại');
    }
  }

  /** ✏️ Cập nhật giao dịch tồn kho */
  async updateInventoryTransaction(
    id: number,
    dto: UpdateInventoryTransactionDto,
    userId: number
  ) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['variant', 'inventory'],
    });
    if (!transaction)
      throw new NotFoundException('Không tìm thấy giao dịch tồn kho');

    const inventory = transaction.inventory;
    if (!inventory) throw new NotFoundException('Không tìm thấy kho liên quan');

    // Hoàn tác giao dịch cũ
    switch (transaction.transactionType) {
      case TransactionType.IMPORT:
        inventory.quantity -= transaction.quantity;
        break;
      case TransactionType.EXPORT:
        inventory.quantity += transaction.quantity;
        break;
      case TransactionType.ADJUSTMENT:
        inventory.quantity -= transaction.quantity;
        break;
    }

    // Áp dụng giao dịch mới
    switch (dto.transactionType ?? transaction.transactionType) {
      case TransactionType.IMPORT:
        inventory.quantity += dto.quantity ?? transaction.quantity;
        break;
      case TransactionType.EXPORT:
        if (inventory.quantity < (dto.quantity ?? transaction.quantity)) {
          throw new BadRequestException('Số lượng tồn không đủ để xuất');
        }
        inventory.quantity -= dto.quantity ?? transaction.quantity;
        break;
      case TransactionType.ADJUSTMENT:
        inventory.quantity += dto.quantity ?? transaction.quantity;
        break;
    }

    transaction.quantity = dto.quantity ?? transaction.quantity;
    transaction.transactionType =
      dto.transactionType ?? transaction.transactionType;
    transaction.note = dto.note ?? transaction.note;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) transaction.createdBy = user;

    await this.inventoryRepo.save(inventory);
    await this.transactionRepo.save(transaction);

    // Cập nhật stock trong variant
    const total = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.quantity)', 'sum')
      .where('inv.variant_id = :variantId', {
        variantId: transaction.variant.id,
      })
      .getRawOne();

    await this.variantRepo.update(transaction.variant.id, {
      stock: total.sum || 0,
    });

    return transaction;
  }

  /** ❌ Xóa giao dịch tồn kho */
  async deleteInventoryTransaction(id: number) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['variant', 'inventory'],
    });
    if (!transaction)
      throw new NotFoundException('Không tìm thấy giao dịch tồn kho');

    const inventory = transaction.inventory;
    // Hoàn tác trước khi xóa
    switch (transaction.transactionType) {
      case TransactionType.IMPORT:
        inventory.quantity -= transaction.quantity;
        break;
      case TransactionType.EXPORT:
        inventory.quantity += transaction.quantity;
        break;
      case TransactionType.ADJUSTMENT:
        inventory.quantity -= transaction.quantity;
        break;
    }

    await this.inventoryRepo.save(inventory);
    await this.transactionRepo.delete(id);

    // Cập nhật lại tồn kho trong variant
    const total = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.quantity)', 'sum')
      .where('inv.variant_id = :variantId', {
        variantId: transaction.variant.id,
      })
      .getRawOne();

    await this.variantRepo.update(transaction.variant.id, {
      stock: total.sum || 0,
    });

    return { message: 'Xóa giao dịch tồn kho thành công' };
  }
}
