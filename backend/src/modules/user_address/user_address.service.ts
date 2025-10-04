import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from './user_address.entity';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>
  ) {}

  async create(
    createUserAddressDto: CreateUserAddressDto & { userId: number }
  ) {
    // Nếu địa chỉ mới được set mặc định -> gỡ mặc định các địa chỉ khác
    if (createUserAddressDto.isDefault) {
      await this.userAddressRepository.update(
        { user: { id: createUserAddressDto.userId } },
        { isDefault: false }
      );
    }

    const address = this.userAddressRepository.create({
      ...createUserAddressDto,
      user: { id: createUserAddressDto.userId },
    });

    return this.userAddressRepository.save(address);
  }

  async findAllByUserId(userId: number) {
    return this.userAddressRepository.find({
      where: { user: { id: userId } },
    });
  }

  async findOne(id: number, userId: number) {
    const address = await this.userAddressRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException(
        `Address with ID ${id} not found for user ${userId}`
      );
    }
    return address;
  }

  async update(
    id: number,
    userId: number,
    updateUserAddressDto: UpdateUserAddressDto
  ) {
    const address = await this.findOne(id, userId);

    // Nếu cập nhật isDefault = true -> gỡ mặc định các địa chỉ khác
    if (updateUserAddressDto.isDefault) {
      await this.userAddressRepository.update(
        { user: { id: userId } },
        { isDefault: false }
      );
    }

    return this.userAddressRepository.save({
      ...address,
      ...updateUserAddressDto,
    });
  }

  async remove(id: number, userId: number) {
    const address = await this.findOne(id, userId); // Kiểm tra quyền sở hữu
    return this.userAddressRepository.remove(address);
  }
}
