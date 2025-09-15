import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { v4 as uuidv4 } from 'uuid';
import { UpdateBrandDto } from '../brands/dto/update-brand.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

   async findAll() {
    return this.repo.find({ relations: ['media'] });
  }
   async findOne(id:number){
    const product = await this.repo.findOne({where :{id}})
    if(!product) throw new NotFoundException ('Product not found')
      return product;
   }

   async create(data: Partial<Product>) {
    if (!data) data = {};
    const product = this.repo.create({
      ...data,
      uuid: data.uuid || uuidv4(),  
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.repo.save(product);
  }
   
  async update ( id:number , dto: UpdateProductDto){
   const product = await this.findOne(id);
   if(dto.slug && dto.slug !== product.slug){
    const exist = await this.repo.findOne({where:{slug:dto.slug}});
    if(exist) throw new NotFoundException ('Slug already exists')
   }
   Object.assign(product,{
    ...dto,
    slug: dto.slug || product.slug,
    updated_at : new Date(),
   })
   return this.repo.save(product)
  }

  async remove (id: number){
    const product = await this.findOne(id)
    return this.repo.remove(product)
  }

}
