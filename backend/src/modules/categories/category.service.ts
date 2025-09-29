import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { v4 as uuidv4 } from 'uuid';
import {generateUniqueSlug } from '../../common/utils/slug.util';
import { Product } from '../product/product.entity';
import { ProductCategory } from '../product_category/product_category.entity';
import { BadRequestException } from '@nestjs/common';
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(ProductCategory)
    private productCategoryRepo: Repository<ProductCategory>,
  
  
){}
 

async findAll(search?: string): Promise<Category[]> {
  const qb = this.categoryRepo.createQueryBuilder('c');

  qb.where('c.is_deleted = :isDeleted', { isDeleted: false }); // bỏ category đã xóa

  if (search) {
    qb.andWhere('c.name LIKE :name', { name: `%${search}%` });
  }

  qb.leftJoinAndSelect('c.parent', 'parent'); // nếu muốn trả parent info luôn

  return qb.getMany();
}


  async findOne( id: number){
    const cat = await this.categoryRepo.findOne({where: {id},relations:['parent','children']})
    if(!cat) throw new NotFoundException('category not found')
        return cat;
  }

   async create(dto: CreateCategoryDto) {
    const slug = await generateUniqueSlug(this.categoryRepo, dto.name);

    const cat = this.categoryRepo.create({
      ...dto,
      uuid: uuidv4(),
      slug,
      created_at: new Date(),
      is_deleted: false,
    });

    return this.categoryRepo.save(cat);
  }
async update(id: number, dto: UpdateCategoryDto) {
  const cat = await this.findOne(id);

  cat.name = dto.name ?? cat.name;
  cat.image = dto.image ?? cat.image;

  if (dto.parent_id === null) {
    // ✅ gỡ parent ra
    cat.parent = null;
  } else if (dto.parent_id) {
    // ✅ gán parent mới
    const parent = await this.categoryRepo.findOneBy({ id: dto.parent_id });
    if (!parent) throw new BadRequestException("Parent not found");
    cat.parent = parent;
  }

  return this.categoryRepo.save(cat);
}


 async remove(id: number) {
  const cat = await this.findOne(id);
  if (!cat) throw new NotFoundException('Category not found');

  cat.is_deleted = true;
  return this.categoryRepo.save(cat);
}

async findProductsBySlug(slug: string): Promise<Product[]> {
  const category = await this.categoryRepo.findOne({
    where: { slug, is_deleted: false },
  });
  if (!category) throw new NotFoundException('Category not found');

  const categoryIds = await this.getAllCategoryIds(category.id);

  const productCategories = await this.productCategoryRepo.find({
    where: { category_id: In(categoryIds),
     product: { status: 'active' }
     },
    relations: ['product', 'product.media', 'product.variants', 'product.brand'],
  });

  // Lọc product null
  const products = productCategories
    .map(pc => pc.product)
    .filter((p): p is Product => p != null);

  // Loại bỏ trùng lặp
  const unique = Array.from(new Map(products.map(p => [p.id, p])).values());

  return unique;
}

async findBrandsByCategorySlug(slug: string) {
  const products = await this.findProductsBySlug(slug);

  const uniqueBrandsMap = new Map<number, { id: number; name: string; logo_url?: string }>();

  products.forEach((p) => {
    if (p.brand && !uniqueBrandsMap.has(p.brand.id)) {
      uniqueBrandsMap.set(p.brand.id, {
        id: p.brand.id,
        name: p.brand.name,
        logo_url: p.brand.logo_url,
      });
    }
  });

  return Array.from(uniqueBrandsMap.values());
}



/**
 * Hàm đệ quy lấy toàn bộ id category con
 */
private async getAllCategoryIds(parentId: number): Promise<number[]> {
  const children = await this.categoryRepo.find({ where: { parent_id: parentId } });
  let ids = [parentId];

  for (const child of children) {
    const childIds = await this.getAllCategoryIds(child.id);
    ids = ids.concat(childIds);
  }

  return ids;
}

// category.service.ts
async findChildren(parentId: number) {
  return this.categoryRepo.find({
    where: { parent_id: parentId }, // giả sử bạn lưu parent_id
    order: { name: 'ASC' },
  });
}

}