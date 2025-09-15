import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { v4 as uuidv4 } from 'uuid';
import {generateUniqueSlug } from '../../common/utils/slug.util';
@Injectable()
export class CategoryService {
  constructor(@InjectRepository(Category) private categoryRepo: Repository<Category>) {}
 

  async findAll(){
    return this.categoryRepo.find({relations:['parent','children']})
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
    });

    return this.categoryRepo.save(cat);
  }
  async update(id: number, dto: UpdateCategoryDto){
    const cat = await this.findOne(id)
    Object.assign(cat,dto)
    return this.categoryRepo.save(cat)
  }

  async remove(id: number){
    const cat = await this.findOne(id)
     return this.categoryRepo.remove(cat)
  }
}
