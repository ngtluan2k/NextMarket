import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DeepPartial } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
  InventoryDto,
} from './dto/product-response.dto';
import { Like } from 'typeorm';
import { ProductTag } from '../product_tag/product_tag.entity';
import { Tag } from '../tag/tag.entity';
import { Not } from 'typeorm';
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dataSource: DataSource,
    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,
    @InjectRepository(ProductMedia)
    private readonly mediaRepo: Repository<ProductMedia>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(PricingRules)
    private readonly pricingRuleRepo: Repository<PricingRules>,
    @InjectRepository(ProductTag)
    private readonly productTagRepo: Repository<ProductTag>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepo: Repository<ProductCategory>
  ) {}

  async saveProduct(
    dto: CreateProductDto,
    userId: number,
    status: 'draft' | 'active'
  ) {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager
        .createQueryBuilder(Store, 'store')
        .where('store.user_id = :userId', { userId })
        .getOne();
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
          // tìm variant nếu có variant_sku
          const variant = pr.variant_sku ? variantMap[pr.variant_sku] : null;

          await manager.save(PricingRules, {
            product,
            variant, // liên kết variant nếu có
            type: pr.type,
            min_quantity: pr.min_quantity,
            price: pr.price,
            cycle: pr.cycle,
            starts_at: pr.starts_at ? new Date(pr.starts_at) : undefined,
            ends_at: pr.ends_at ? new Date(pr.ends_at) : undefined,
            uuid: require('uuid').v4(),
            name: pr.name ?? `${product.name} - ${pr.type}`, // fallback tên
            status: pr.status ?? 'active', // default active
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

  async findOne(id: number, userId?: number) {
    const product = await this.productRepo.findOne({
      where: userId
        ? { id, store: { user_id: userId } } // chỉ check nếu có userId
        : { id },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'variants.inventories',
        'pricing_rules',
      ],
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async removeProduct(productId: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    // đổi status thành deleted
    product.status = 'deleted';
    await this.productRepo.save(product); // lưu lại database

    return { message: 'Product has been soft-deleted' };
  }

  // product.service.ts

  async updateProduct(id: number, dto: any, userId: number) {
    const pricingRules =
      typeof dto.pricing_rules === 'string'
        ? JSON.parse(dto.pricing_rules)
        : dto.pricing_rules;

    console.log('pricingRules:', pricingRules); // kiểm tra
    // --- Lấy product với tất cả quan hệ ---
    const product = await this.productRepo.findOne({
      where: { id },
      relations: [
        'store',
        'brand',
        'categories',
        'media',
        'variants',
        'variants.inventories',
        'pricing_rules',
      ],
    });
    if (!product) throw new NotFoundException('Product not found');

    if (product.store.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa sản phẩm này');
    }

    // --- Cập nhật product chính ---
    const updatedProduct = await this.productRepo.save({
      ...product,
      ...dto,
      status: dto.status ?? product.status,
    });

    // --- Update categories ---
    if (Array.isArray(dto.categories)) {
      for (const catId of dto.categories) {
        const exists = product.categories.find((c) => c.id === catId);
        if (!exists) {
          await this.productCategoryRepo.save({
            product: { id },
            category: { id: catId },
          });
        }
      }
    }

    // --- Update media ---
    if (Array.isArray(dto.media)) {
      for (const mediaDto of dto.media) {
        if (mediaDto.id) {
          await this.mediaRepo.update(mediaDto.id, { ...mediaDto });
        } else {
          await this.mediaRepo.save({ ...mediaDto, product: { id } });
        }
      }
    }

    // --- Update variants + inventories ---
    const variantMap: Record<string, Variant> = {}; // Tạo variantMap từ DTO
    if (Array.isArray(dto.variants)) {
      for (const variantDto of dto.variants) {
        let variant: Variant;
        const { inventories, ...variantData } = variantDto;

        if (variantDto.id) {
          // Update variant đã có
          await this.variantRepo.update(variantDto.id, { ...variantData });
          const found = await this.variantRepo.findOne({
            where: { id: variantDto.id },
          });
          if (!found) throw new NotFoundException('Variant not found');
          variant = found;
        } else {
          // Thêm variant mới
          variant = await this.variantRepo.save({
            ...variantData,
            product: { id },
          });
        }

        // Map variant để dùng cho pricing rules
        if (variant.sku) variantMap[variant.sku] = variant;

        // --- Update inventories ---
        if (Array.isArray(inventories)) {
          for (const invDto of inventories) {
            if (invDto.id) {
              await this.inventoryRepo.update(invDto.id, {
                location: invDto.location,
                quantity: invDto.quantity,
                used_quantity: invDto.used_quantity,
                variant: { id: variant.id },
                product: { id },
              });
            } else {
              await this.inventoryRepo.save({
                location: invDto.location,
                quantity: invDto.quantity,
                used_quantity: invDto.used_quantity,
                variant: { id: variant.id },
                product: { id },
              });
            }
          }
        }
      }
    }

    if (Array.isArray(dto.pricing_rules)) {
      for (const ruleDto of dto.pricing_rules) {
        // --- map variant, nếu không có thì undefined ---
        const variant = ruleDto.variant_sku
          ? variantMap[ruleDto.variant_sku]
          : undefined;

        if (ruleDto.id) {
          // --- Update existing rule ---
          const existingRule = await this.pricingRuleRepo.findOne({
            where: { id: ruleDto.id },
          });
          if (!existingRule) continue;

          // --- LOG trước save ---
          console.log('Updating PricingRule id:', ruleDto.id);
          console.log('ruleDto:', ruleDto);
          console.log('Mapped variant:', variant);

          existingRule.type = ruleDto.type;
          existingRule.min_quantity = ruleDto.min_quantity;
          existingRule.price = ruleDto.price;
          existingRule.cycle = ruleDto.cycle;
          existingRule.starts_at = ruleDto.starts_at
            ? new Date(ruleDto.starts_at)
            : undefined;
          existingRule.ends_at = ruleDto.ends_at
            ? new Date(ruleDto.ends_at)
            : undefined;
          existingRule.variant = variant; // Variant | undefined
          existingRule.name =
            ruleDto.name ?? `${product.name} - ${ruleDto.type}`;
          existingRule.status = ruleDto.status ?? 'active';
          existingRule.product = { id } as any;

          const savedRule = await this.pricingRuleRepo.save(existingRule);

          // --- LOG sau save ---
          console.log('Saved PricingRule:', savedRule);
        } else {
          // --- Create new rule ---
          const newRule: DeepPartial<PricingRules> = {
            type: ruleDto.type,
            min_quantity: ruleDto.min_quantity,
            price: ruleDto.price,
            cycle: ruleDto.cycle,
            starts_at: ruleDto.starts_at
              ? new Date(ruleDto.starts_at)
              : undefined,
            ends_at: ruleDto.ends_at ? new Date(ruleDto.ends_at) : undefined,
            variant: variant, // Variant | undefined
            name: ruleDto.name ?? `${product.name} - ${ruleDto.type}`,
            status: ruleDto.status ?? 'active',
            product: { id } as any,
            uuid: ruleDto.uuid ?? require('uuid').v4(),
          };

          console.log('Creating new PricingRule:', newRule);

          const savedNewRule = await this.pricingRuleRepo.save(newRule);

          console.log('Saved new PricingRule:', savedNewRule);
        }
      }
    }

    return updatedProduct;
  }

  async updateAndPublishProduct(id: number, dto: any, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!product) throw new NotFoundException('Product not found');

    if (product.store.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa sản phẩm này');
    }

    // Update + force publish
    return await this.productRepo.save({
      ...product,
      ...dto,
      status: 'active',
    });
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
      .leftJoinAndSelect('product.media', 'media')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.inventories', 'inventory') // join inventory theo variant
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categories', 'pc')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('product.pricing_rules', 'pricing_rules')
      .leftJoinAndSelect('pricing_rules.variant', 'pricing_rule_variant')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.slug = :slug', { slug })
      .getOne();

    if (!product) throw new NotFoundException('Product not found');

    // Map inventory theo variant SKU
    const variantInventoryMap: Record<string, InventoryDto[]> = {};
    product.variants.forEach((v) => {
      variantInventoryMap[v.sku] = (v.inventories || []).map((inv) => ({
        id: inv.id,
        variant_sku: v.sku,
        location: inv.location,
        quantity: inv.quantity,
        used_quantity: inv.used_quantity,
      }));
    });

    // Map product sang DTO
    const response: ProductResponseDto = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      description: product.description,
      status: product.status,
      base_price: product.base_price,
      avg_rating: product.avg_rating, // thêm dòng này
      review_count: product.review_count, // thêm dòng này
      media: product.media.map((m) => ({
        url: m.url,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        variant_name: v.variant_name,
        price: v.price,
        stock: v.stock,
        inventory: variantInventoryMap[v.sku] || [],
      })),
      inventories: variantInventoryMap, // toàn bộ inventory map
      brand: product.brand
        ? { id: product.brand.id, name: product.brand.name }
        : undefined,
      categories: product.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),

      pricing_rules: product.pricing_rules.map((pr) => ({
        id: pr.id,
        type: pr.type,
        min_quantity: pr.min_quantity,
        price: pr.price,
        cycle: pr.cycle,
        starts_at: pr.starts_at,
        ends_at: pr.ends_at,
        name: pr.name,
        status: pr.status,
        variant_sku: pr.variant ? pr.variant.sku : null,
      })),
      store: product.store
        ? {
            id: product.store.id,
            name: product.store.name,
            slug: product.store.slug,
            logo_url: product.store.logo_url,
            avg_rating: product.store.avg_rating,
            review_count: product.store.review_count,
          }
        : undefined,
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
        'variants.inventories',
        'pricing_rules',
        'pricing_rules.variant',
      ],
    });
  }
  async searchProducts(query: string) {
    if (!query) return [];

    return this.productRepo.find({
      where: [
        { name: Like(`%${query}%`), status: 'active' },
        { slug: Like(`%${query}%`), status: 'active' },
        { description: Like(`%${query}%`), status: 'active' },
      ],
      relations: ['store', 'media', 'brand'],
      take: 10,
    });
  }
  async toggleProductStatus(productId: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['store'], // phải có để kiểm tra quyền
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.store.user_id !== userId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa sản phẩm này');

    product.status = product.status === 'active' ? 'draft' : 'active';
    return this.productRepo.save(product);
  }

  async countByStoreId(storeId: number): Promise<number> {
    return this.productRepo.count({
      where: {
        store: { id: storeId }, // nếu Product có quan hệ ManyToOne với Store
        status: 'active', // nếu chỉ muốn đếm sản phẩm đang active
      },
    });
  }

  async findSimilarProducts(productId: number): Promise<Product[]> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['productTags', 'productTags.tag'],
    });

    if (!product) throw new NotFoundException('Product not found');

    const tagIds = product.productTags.map((pt) => pt.tag_id);

    if (tagIds.length === 0) return [];

    const similarProducts = await this.productRepo
      .createQueryBuilder('p')
      .innerJoin('product_tag', 'pt', 'pt.product_id = p.id')
      .where('pt.tag_id IN (:...tagIds)', { tagIds })
      .andWhere('p.id != :productId', { productId })
      .andWhere('p.status = :status', { status: 'active' })
      .leftJoinAndSelect('p.media', 'media', 'media.is_primary = :isPrimary', {
        isPrimary: true,
      })
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.store', 'store')
      .distinct(true)
      .take(10) // Limit to 10 similar products
      .getMany();

    return similarProducts;
  }

  async findById(id: number) {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.media', 'media')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.inventories', 'inventory')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categories', 'pc')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('product.pricing_rules', 'pricing_rules')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product; // or map to your existing DTO
  }

  async getSlugById(id: number): Promise<string> {
    const row = await this.productRepo.findOne({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!row) {
      throw new NotFoundException('Product not found');
    }
    return row.slug;
  }
}
