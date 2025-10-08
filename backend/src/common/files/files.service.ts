// src/files/files.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadPath = path.join(__dirname, '../../uploads/products');

  constructor(private readonly dataSource: DataSource) {}

  async cleanUnusedFiles() {
    try {
      const filesInUploads = fs.readdirSync(this.uploadPath);
      const result = await this.dataSource.query(
        `SELECT url FROM product_media`
      );
      const dbFiles = result.map((row: any) => path.basename(row.url));
      const unusedFiles = filesInUploads.filter(
        (file) => !dbFiles.includes(file)
      );

      // 👉 Import động để tránh lỗi require() ESM
      const { default: trash } = await import('trash');

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

  @Cron('0 * * * *')
  async handleHourlyCleanup() {
    this.logger.log('Running hourly cleanup of unused uploads...');
    await this.cleanUnusedFiles();
  }
}
