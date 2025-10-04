import { Controller, Post } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('clean')
  async clean() {
    await this.filesService.cleanUnusedFiles();
    return { message: 'Cleanup done' };
  }
}