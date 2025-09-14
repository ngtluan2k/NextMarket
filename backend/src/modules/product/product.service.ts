import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { Store } from '../store/store.entity';
import { Brand } from '../brands/brand.entity';
import { Category } from '../categories/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ForbiddenException } from '@nestjs/common/exceptions';
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>
  ) {}

   async findAll() {
    return this.repo.find();
  }
  async findOne(id: number) {
  const product = await this.repo.findOne({
    where: { id },
    relations: ['store', 'brand', 'category'], // load luôn quan hệ
  });
  if (!product) throw new NotFoundException('Product not found');
  return product;
}


    async createProduct(dto: CreateProductDto, userId: number) {
    const store = await this.storeRepository.findOne({ where: { user_id: userId } });
    if (!store) throw new NotFoundException('Store not found for this user');

    const product = this.productRepository.create({
      name: dto.name,
      slug: dto.slug,
      short_description: dto.short_description,
      description: dto.description,
      base_price: dto.base_price,
      status: dto.status || 'active',
      store: { id: store.id } as Store,
      brand: { id: dto.brandId } as Brand,
      category: { id: dto.categoryId } as Category,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.productRepository.save(product);
  }
   
  async update(id: number, dto: UpdateProductDto, userId: number) {
  const product = await this.findOne(id);

  const store = await this.storeRepository.findOne({ where: { user_id: userId } });
  if (!store || product.store.id !== store.id) {
    throw new ForbiddenException('You do not own this product');
  }

  if (dto.slug && dto.slug !== product.slug) {
    const exist = await this.repo.findOne({ where: { slug: dto.slug } });
    if (exist) throw new NotFoundException('Slug already exists');
  }

  Object.assign(product, {
    ...dto,
    slug: dto.slug || product.slug,
    brand: dto.brandId ? ({ id: dto.brandId } as Brand) : product.brand,
    category: dto.categoryId ? ({ id: dto.categoryId } as Category) : product.category,
    store: { id: store.id } as Store,
    updated_at: new Date(),
  });

  return this.repo.save(product);
}



  async remove (id: number){
    const product = await this.findOne(id)
    return this.repo.remove(product)
  }

}
