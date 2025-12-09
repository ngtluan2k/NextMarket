// src/user-address/user_address.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UserAddressService } from './user_address.service';
import { CreateUserAddressDto } from './dto/create-user_address.dto';
import { UpdateUserAddressDto } from './dto/update-user_address.dto';

@Controller('users/:userId/addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) { }

  // POST /users/1/addresses → tạo mới
  @Post()
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createUserAddressDto: CreateUserAddressDto,
  ) {
    // Bỏ hoàn toàn việc kiểm tra user_id từ body
    // Vì frontend có thể gửi hoặc không gửi → ta luôn ưu tiên userId từ URL (an toàn hơn)
    return this.userAddressService.create({
      ...createUserAddressDto,
      userId, // ghi đè userId từ URL → 100% đúng
    });
  }

  // GET /users/1/addresses → danh sách
  @Get()
  async findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.userAddressService.findAllByUserId(userId);
  }

  // GET /users/1/addresses/10 → lấy 1 cái
  @Get(':id')
  async findOne(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userAddressService.findOne(id, userId);
  }

  // PATCH /users/1/addresses/10 → cập nhật
  @Patch(':id')
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
  ) {
    return this.userAddressService.update(id, userId, updateUserAddressDto);
  }

  // DELETE /users/1/addresses/10 → xóa
  @Delete(':id')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userAddressService.remove(id, userId);
    return { success: true, message: 'Đã xóa địa chỉ thành công' };
  }

  // API ADMIN / DEV: Fix lại toàn bộ mã GHN cho tất cả người dùng (chỉ gọi 1 lần)
  @Post('fix-all-ghn') // tự viết guard hoặc bỏ nếu dev
  async fixAllGhn() {
    const userIds = await this.userAddressService.getAllUserIdsWithAddresses();
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.userAddressService.updateAllGHNInfoForUser(userId);
      success += result.updated;
      failed += result.failed;
    }

    return { success, failed, message: 'Đã fix xong toàn bộ địa chỉ' };
  }
}