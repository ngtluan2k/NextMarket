import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>
  ) {}

  async findAll(userId: number) {
    try {
      const inventories = await this.repo.find({
        relations: ['product', 'product.store', 'product.brand', 'variant'],
      });

      return inventories.map((i) => ({
        ...i,
        available_quantity: Math.max(0, i.quantity - i.used_quantity),
      }));
    } catch (error) {
      console.error('Error fetching inventories:', error);
      throw new InternalServerErrorException('Failed to fetch inventories');
    }
  }

  async addInventory(dto: CreateInventoryDto, userId: number, role: string) {
    try {
      if (!dto.productId || !dto.location || dto.quantity < 0) {
        throw new BadRequestException('Invalid input data');
      }

      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
        relations: ['store'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      let variant: Variant | null = null;
      if (dto.variantId) {
        variant = await this.variantRepo.findOne({
          where: { id: dto.variantId, product: { id: dto.productId } },
          relations: ['product'],
        });
        if (!variant) {
          throw new NotFoundException(
            'Variant not found or does not belong to this product'
          );
        }
      }

      const inventory = this.repo.create({
        product,
        variant: variant || null,
        location: dto.location,
        quantity: dto.quantity,
        used_quantity: dto.used_quantity || 0,
        updatedAt: new Date(),
      });

      return await this.repo.save(inventory);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error adding inventory:', error);
      throw new InternalServerErrorException('Failed to add inventory');
    }
  }

  async updateInventory(
    id: number,
    dto: UpdateInventoryDto,
    userId: number,
    role: string
  ) {
    try {
      const inventory = await this.repo.findOne({
        where: { id },
        relations: ['product', 'product.store', 'variant'],
      });

      if (!inventory) {
        throw new NotFoundException('Inventory not found');
      }

      // Update product
      if (dto.productId && dto.productId !== inventory.product.id) {
        const product = await this.productRepo.findOne({
          where: { id: dto.productId },
          relations: ['store'],
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        inventory.product = product;
      }

      // Update variant
      if (dto.variantId !== undefined) {
        if (dto.variantId) {
          const productId = dto.productId || inventory.product.id;
          const variant = await this.variantRepo.findOne({
            where: { id: dto.variantId, product: { id: productId } },
            relations: ['product'],
          });

          if (!variant) {
            throw new NotFoundException(
              'Variant not found or does not belong to this product'
            );
          }

          inventory.variant = variant;
        } else {
          // Nếu gửi null → xoá variant
          inventory.variant = null;
        }
      }

      // Update other fields
      if (dto.location !== undefined) inventory.location = dto.location;
      if (dto.quantity !== undefined) inventory.quantity = dto.quantity;
      if (dto.used_quantity !== undefined)
        inventory.used_quantity = dto.used_quantity;

      inventory.updatedAt = new Date();

      return await this.repo.save(inventory);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error updating inventory:', error);
      throw new InternalServerErrorException('Failed to update inventory');
    }
  }

  async deleteInventory(id: number, userId: number, role: string) {
    try {
      const inventory = await this.repo.findOne({
        where: { id },
        relations: ['product', 'product.store'],
      });

      if (!inventory) {
        throw new NotFoundException('Inventory not found');
      }

      await this.repo.delete(id);
      return { message: 'Inventory deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error deleting inventory:', error);
      throw new InternalServerErrorException('Failed to delete inventory');
    }
  }
}
