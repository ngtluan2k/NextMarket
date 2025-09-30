import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { UserAddressService } from './user_address.service';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

@Controller('users/:userId/addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Post()
  create(@Param('userId') userId: string, @Body() createUserAddressDto: CreateUserAddressDto) {
    // Đảm bảo user_id trong DTO khớp với userId từ URL
    if (createUserAddressDto.user_id && createUserAddressDto.user_id !== +userId) {
      throw new ForbiddenException('user_id trong payload không khớp với userId trong URL');
    }
    return this.userAddressService.create({ ...createUserAddressDto, userId: +userId });
  }

  @Get()
  findAll(@Param('userId') userId: string) {
    return this.userAddressService.findAllByUserId(+userId);
  }

  @Get(':id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.userAddressService.findOne(+id, +userId);
  }

  @Patch(':id')
  update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto
  ) {
    return this.userAddressService.update(+id, +userId, updateUserAddressDto);
  }

  @Delete(':id')
  remove(@Param('userId') userId: string, @Param('id') id: string) {
    return this.userAddressService.remove(+id, +userId);
  }
}