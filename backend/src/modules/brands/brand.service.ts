import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(@InjectRepository(Brand) private readonly repo: Repository<Brand>) {}

  async list(keyword?: string){
    const where = keyword ? {name: ILike(`%${keyword}%`)}:{};
    const data = await this.repo.find({where})
    return { total : data.length,data}
  }

  async detail ( id: number){
    const brand = await this.repo.findOne({where :{id}})
    if(!brand) throw new NotFoundException ('Brand not found')
        return brand
  }

  async create(dto : CreateBrandDto) {
   const brand = this.repo.create({
    ...dto,
    uuid:uuidv4(),
    created_at: new Date(),

   })

   return this.repo.save(brand)
  }


  async update( id: number, dto:UpdateBrandDto){
    const brand = await this.detail(id)

    Object.assign(brand,dto)
    return this.repo.save(brand)
  }


  async remove (id: number){
    const brand = await this.detail(id)
    await this.repo.remove(brand)
    return {id}
  }


}