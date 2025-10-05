// File: backend/src/modules/store-identification/store-identification.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreIdentification } from './store-identification.entity';
import { Store } from '../store/store.entity';
import { CreateStoreIdentificationDto } from './dto/create-store-identification.dto';
import { UpdateStoreIdentificationDto } from './dto/update-store-identification.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreIdentificationService {
  constructor(
    @InjectRepository(StoreIdentification)
    private storeIdentificationRepo: Repository<StoreIdentification>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>
  ) {}

  // Tạo store identification
  async create(
    createDto: CreateStoreIdentificationDto,
    userId: number
  ): Promise<StoreIdentification> {
    await this.verifyStoreOwnership(createDto.store_id, userId);
    const identification = this.storeIdentificationRepo.create(createDto);
    return await this.storeIdentificationRepo.save(identification);
  }

  // Lấy store identification theo store_id
  async findByStoreId(
    storeId: number,
    userId: number
  ): Promise<StoreIdentification | null> {
    await this.verifyStoreOwnership(storeId, userId);
    return await this.storeIdentificationRepo.findOne({
      where: { store_id: storeId },
    });
  }

  // Cập nhật store identification
  async update(
    storeId: number,
    updateDto: UpdateStoreIdentificationDto,
    userId: number
  ): Promise<StoreIdentification> {
    const identification = await this.findByStoreId(storeId, userId);
    if (!identification) {
      throw new NotFoundException('Store identification not found');
    }
    Object.assign(identification, updateDto);
    return await this.storeIdentificationRepo.save(identification);
  }

  // Upload ảnh CCCD tạm (không cần store_id) -> chỉ trả về file_url
  async uploadTempImage(
    file: Express.Multer.File,
    side: 'front' | 'back'
  ): Promise<{ file_url: string }> {
    this.validateImageFile(file);
    const filePath = this.saveImageToDisk(file, side);
    return { file_url: filePath };
  }

  // Upload ảnh mặt trước CCCD (có storeId, ghi DB)
  async uploadFrontImage(
    storeId: number,
    file: Express.Multer.File,
    userId: number
  ): Promise<StoreIdentification> {
    await this.verifyStoreOwnership(storeId, userId);
    this.validateImageFile(file);

    const filePath = this.saveImageToDisk(file, 'front');

    let identification = await this.findByStoreId(storeId, userId);
    if (!identification) {
      identification = this.storeIdentificationRepo.create({
        store_id: storeId,
        type: 'CCCD',
        full_name: '',
        img_front: filePath,
      });
    } else {
      if (identification.img_front) {
        await this.deletePhysicalFile(identification.img_front);
      }
      identification.img_front = filePath;
    }

    return await this.storeIdentificationRepo.save(identification);
  }

  // Upload ảnh mặt sau CCCD (có storeId, ghi DB)
  async uploadBackImage(
    storeId: number,
    file: Express.Multer.File,
    userId: number
  ): Promise<StoreIdentification> {
    await this.verifyStoreOwnership(storeId, userId);
    this.validateImageFile(file);

    const filePath = this.saveImageToDisk(file, 'back');

    let identification = await this.findByStoreId(storeId, userId);
    if (!identification) {
      identification = this.storeIdentificationRepo.create({
        store_id: storeId,
        type: 'CCCD',
        full_name: '',
        img_back: filePath,
      });
    } else {
      if (identification.img_back) {
        await this.deletePhysicalFile(identification.img_back);
      }
      identification.img_back = filePath;
    }

    return await this.storeIdentificationRepo.save(identification);
  }

  // Xóa store identification
  async remove(storeId: number, userId: number): Promise<void> {
    const identification = await this.findByStoreId(storeId, userId);
    if (!identification) {
      throw new NotFoundException('Store identification not found');
    }

    if (identification.img_front) {
      await this.deletePhysicalFile(identification.img_front);
    }
    if (identification.img_back) {
      await this.deletePhysicalFile(identification.img_back);
    }

    await this.storeIdentificationRepo.remove(identification);
  }

  // Private helpers
  private async verifyStoreOwnership(
    storeId: number,
    userId: number
  ): Promise<void> {
    const store = await this.storeRepo.findOne({
      where: { id: storeId },
    });
    if (!store || store.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this store');
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size must be less than 5MB');
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  private saveImageToDisk(
    file: Express.Multer.File,
    side: 'front' | 'back'
  ): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'identification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileExtension = path.extname(file.originalname);
    const fileName = `cccd-${side}-${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/identification/${fileName}`;
  }

  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Đã xóa file: ${fullPath}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi xóa file ${filePath}:`, error);
    }
  }

  // Lấy data file để stream xem ảnh
  async getFileData(
    filePath: string,
    userId: number
  ): Promise<{
    data: Buffer;
    mimetype: string;
    filename: string;
  }> {
    const identification = await this.storeIdentificationRepo.findOne({
      where: [{ img_front: filePath }, { img_back: filePath }],
      relations: ['store'],
    });

    if (!identification || identification.store.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    const fileData = fs.readFileSync(fullPath);
    const filename = path.basename(filePath);

    const ext = path.extname(filename).toLowerCase();
    let mimetype = 'image/jpeg';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimetype = 'image/jpeg';
        break;
      case '.png':
        mimetype = 'image/png';
        break;
    }

    return {
      data: fileData,
      mimetype,
      filename,
    };
  }
}
