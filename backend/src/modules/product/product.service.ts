import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './product.entity';
import { Store } from '../store/store.entity';
import { Brand } from '../brands/brand.entity';
import { ProductCategory } from '../product_category/product_category.entity';
import { ProductMedia } from '../product_media/product_media.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { generateUniqueSlug } from '../../common/utils/slug.util';
import { Inventory } from '../inventory/inventory.entity';
import {
  CategoryDto,
  MediaDto,
  PricingRuleDto,
  ProductResponseDto,
  VariantDto,
} from './dto/product-response.dto';
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dataSource: DataSource
  ) {}

  async saveProduct(
    dto: CreateProductDto,
    userId: number,
    status: 'draft' | 'active'
  ) {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, {
        where: { user_id: userId },
      });
      if (!store) throw new NotFoundException('Store not found');
      const slug = await generateUniqueSlug(this.productRepo, dto.name);

      const product = manager.create(Product, {
        name: dto.name,
        slug,
        short_description: dto.short_description,
        description: dto.description,
        base_price: dto.base_price,
        status,
        store_id: store.id, // dùng store_id chứ không dùng store: { id: ... }
        brand_id: dto.brandId, // dùng brand_id
      });
      await manager.save(product);

      // Product categories
      if (dto.categories?.length) {
        for (const catId of dto.categories) {
          await manager.save(ProductCategory, { product, category_id: catId });
        }
      }

      // Media
      if (dto.media?.length) {
        for (const m of dto.media) {
          await manager.save(ProductMedia, { ...m, product });
        }
      }

      // Variants
      const variantMap: Record<string, any> = {};
      if (dto.variants?.length) {
        for (const v of dto.variants) {
          const variant = manager.create(Variant, { ...v, product });
          await manager.save(variant);
          variantMap[v.sku] = variant;
        }
      }

      // Inventory
      if (dto.inventory?.length) {
        for (const inv of dto.inventory) {
          const variant = variantMap[inv.variant_sku];
          if (!variant)
            throw new NotFoundException(
              `Variant SKU ${inv.variant_sku} not found`
            );

          await manager.save(Inventory, {
            uuid: require('uuid').v4(),
            product,
            variant,
            location: inv.location,
            quantity: inv.quantity,
            used_quantity: inv.used_quantity || 0,
          });
        }
      }

      if (dto.pricing_rules?.length) {
        for (const pr of dto.pricing_rules) {
          await manager.save(PricingRules, {
            product,
            type: pr.type,
            min_quantity: pr.min_quantity,
            price: pr.price,
            cycle: pr.cycle,
            starts_at: pr.starts_at ? new Date(pr.starts_at) : undefined,
            ends_at: pr.ends_at ? new Date(pr.ends_at) : undefined,
            uuid: require('uuid').v4(),
          });
        }
      }

      return product;
    });
  }

  async createProduct(dto: CreateProductDto, userId: number) {
    return this.saveProduct(dto, userId, 'draft');
  }

  async publishProduct(dto: CreateProductDto, userId: number) {
    return this.saveProduct(dto, userId, 'active');
  }
  // ProductService.ts
  async findAll(userId: number) {
    return this.productRepo.find({
      where: { store: { user_id: userId } },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'pricing_rules',
      ],
    });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id, store: { user_id: userId } },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'pricing_rules',
      ],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: number, dto: CreateProductDto, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.user_id !== userId)
      throw new ForbiddenException('Not allowed');

    // Cập nhật tất cả các thông tin như createProduct
    return this.saveProduct(dto, userId, product.status as 'draft' | 'active');
  }

  async remove(id: number, userId: number) {
    const product = await this.findOne(id, userId);
    return this.productRepo.remove(product);
  }

  async findAllProduct() {
    return this.productRepo.find({
      where: { status: 'active' },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'pricing_rules',
      ], // nếu muốn show thêm info store
    });
  }
  // product.service.ts
  // async findBySlug(slug: string) {
  //   const product = await this.productRepo.findOne({ where: { slug }, relations: ['media','variants','brand','categories','pricing_rules','store']
  //  });
  //   if (!product) throw new NotFoundException('Product not found');
  //   return product;
  // }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.short_description',
        'product.base_price',
        'product.status',
      ])
      .leftJoinAndSelect(
        'product.media',
        'media',
        'media.is_primary = :isPrimary',
        { isPrimary: true }
      )
      .leftJoinAndSelect('product.variants', 'variants')
      .addSelect([
        'variants.id',
        'variants.variant_name',
        'variants.price',
        'variants.stock',
      ])
      .leftJoinAndSelect('product.brand', 'brand')
      .addSelect(['brand.name'])
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category')
      .addSelect(['category.name'])
      .leftJoinAndSelect(
        'product.pricing_rules',
        'pricing_rules',
        'pricing_rules.ends_at > :now',
        { now: new Date() }
      )
      .addSelect([
        'pricing_rules.type',
        'pricing_rules.min_quantity',
        'pricing_rules.price',
        'pricing_rules.starts_at',
        'pricing_rules.ends_at',
      ])
      .leftJoinAndSelect('product.store', 'store')
      .addSelect(['store.name', 'store.slug'])
      .where('product.slug = :slug', { slug })
      .getOne();

    if (!product) throw new NotFoundException('Product not found');

    // Map sang DTO
    const response: ProductResponseDto = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      base_price: product.base_price,
      media: product.media.map((m): MediaDto => ({ url: m.url })),
      variants: product.variants.map(
        (v): VariantDto => ({
          id: v.id,
          variant_name: v.variant_name,
          price: v.price,
          stock: v.stock,
        })
      ),
      brand: { name: product.brand.name },
      categories: product.categories.map(
        (c): CategoryDto => ({ name: c.category.name })
      ),
      pricing_rules: product.pricing_rules.map(
        (pr): PricingRuleDto => ({
          type: pr.type,
          min_quantity: pr.min_quantity,
          price: pr.price,
        })
      ),
      store: { name: product.store.name, slug: product.store.slug },
    };

    return response;
  }

  async findAllByStoreId(storeId: number) {
    return this.productRepo.find({
      where: { store_id: storeId },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'pricing_rules',
      ],
    });
  }
}
