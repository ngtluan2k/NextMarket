// src/files/files.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import trash from 'trash';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadPath = path.join(__dirname, '../../uploads/products');

  constructor(private readonly dataSource: DataSource) {}

  // Hàm quét và di chuyển file không dùng vào thùng rác
  async cleanUnusedFiles() {
    try {
      // 1. Lấy danh sách file trong thư mục uploads
      const filesInUploads = fs.readdirSync(this.uploadPath);

      // 2. Lấy danh sách ảnh từ database (giả sử table 'products', cột 'image_url')
      // Lấy danh sách file từ bảng product_media
      const result = await this.dataSource.query(
        `SELECT url FROM product_media`
      );

      // Lấy tên file từ URL
      const dbFiles = result.map((row: any) => path.basename(row.url));

      // 3. Lọc những file không có trong DB
      const unusedFiles = filesInUploads.filter(
        (file) => !dbFiles.includes(file)
      );

      // 4. Di chuyển vào thùng rác
      for (const file of unusedFiles) {
        const filePath = path.join(this.uploadPath, file);
        await trash(filePath);
        this.logger.log(`Moved to trash: ${file}`);
      }

      this.logger.log(
        `Cleanup complete. Total files moved: ${unusedFiles.length}`
      );
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  @Cron('0 * * * *') // chạy đúng phút 0 mỗi giờ
  async handleHourlyCleanup() {
    this.logger.log('Running hourly cleanup of unused uploads...');
    await this.cleanUnusedFiles();
  }
}
