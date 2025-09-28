import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';
import { UserAddress } from './user_address.entity';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepo: Repository<UserAddress>,
  ) {}

  async create(createUserAddressDto: CreateUserAddressDto) {
    const newAddress = this.userAddressRepo.create(createUserAddressDto);
    return await this.userAddressRepo.save(newAddress);
  }

  async findAll() {
    return await this.userAddressRepo.find();
  }

  async findOne(id: number) {
    return await this.userAddressRepo.findOne({ where: { id } });
  }

  async update(id: number, updateUserAddressDto: UpdateUserAddressDto) {
    await this.userAddressRepo.update(id, updateUserAddressDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const toDelete = await this.findOne(id);
    if (!toDelete) return null;
    await this.userAddressRepo.delete(id);
    return toDelete;
  }
}
