// src/common/files/files.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FilesService } from './files.service';
import { FilesController } from './files.controller'; // nếu có

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [FilesService],
  controllers: [FilesController], // optional
  exports: [FilesService], // nếu muốn dùng service ở module khác
})
export class FilesModule {}
