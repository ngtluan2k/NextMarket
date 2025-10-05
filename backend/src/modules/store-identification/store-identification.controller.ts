// File: backend/src/modules/store-identification/store-identification.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoreIdentificationService } from './store-identification.service';
import { CreateStoreIdentificationDto } from './dto/create-store-identification.dto';
import { UpdateStoreIdentificationDto } from './dto/update-store-identification.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { multerConfig } from './config/multer.config';

@ApiTags('Store Identification')
@Controller('store-identification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class StoreIdentificationController {
  constructor(
    private readonly storeIdentificationService: StoreIdentificationService
  ) {}

  // Tạo store identification
  @Post()
  @ApiOperation({ summary: 'Create store identification' })
  @ApiResponse({
    status: 201,
    description: 'Store identification created successfully',
  })
  async create(
    @Body() createDto: CreateStoreIdentificationDto,
    @Req() req: any
  ) {
    return await this.storeIdentificationService.create(
      createDto,
      req.user.userId
    );
  }

  // Lấy store identification theo store_id
  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get store identification by store ID' })
  @ApiResponse({ status: 200, description: 'Store identification details' })
  async findByStoreId(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    return await this.storeIdentificationService.findByStoreId(
      storeId,
      req.user.userId
    );
  }

  // Upload ảnh CCCD tạm thời (giống upload Giấy phép) - KHÔNG cần store_id, chỉ trả về file_url
  @Post('upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        side: { type: 'string', enum: ['front', 'back'] },
      },
      required: ['file', 'side'],
    },
  })
  @ApiOperation({ summary: 'Upload ảnh CCCD tạm thời (không cần store_id)' })
  @ApiResponse({ status: 200, description: 'Uploaded successfully' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadTempImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('side') side: 'front' | 'back'
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!['front', 'back'].includes(side)) {
      throw new BadRequestException('Invalid side. Must be "front" or "back"');
    }
    const result = await this.storeIdentificationService.uploadTempImage(
      file,
      side
    );
    return { file_url: result.file_url };
  }

  // Upload ảnh mặt trước CCCD (có storeId, ghi DB)
  @Post('store/:storeId/upload-front')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload front image of identification document' })
  @ApiResponse({
    status: 200,
    description: 'Front image uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFrontImage(
    @Param('storeId', ParseIntPipe) storeId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return await this.storeIdentificationService.uploadFrontImage(
      storeId,
      file,
      req.user.userId
    );
  }

  // Upload ảnh mặt sau CCCD (có storeId, ghi DB)
  @Post('store/:storeId/upload-back')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload back image of identification document' })
  @ApiResponse({ status: 200, description: 'Back image uploaded successfully' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadBackImage(
    @Param('storeId', ParseIntPipe) storeId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return await this.storeIdentificationService.uploadBackImage(
      storeId,
      file,
      req.user.userId
    );
  }

  // Xem ảnh mặt trước
  @Get('store/:storeId/front-image')
  @ApiOperation({ summary: 'View front image' })
  async viewFrontImage(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any,
    @Res() res: Response
  ) {
    const identification = await this.storeIdentificationService.findByStoreId(
      storeId,
      req.user.userId
    );
    if (!identification || !identification.img_front) {
      return res.status(404).json({ message: 'Front image not found' });
    }

    const fileData = await this.storeIdentificationService.getFileData(
      identification.img_front,
      req.user.userId
    );

    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `inline; filename="${fileData.filename}"`,
      'Content-Length': fileData.data.length,
    });

    res.end(fileData.data);
  }

  // Xem ảnh mặt sau
  @Get('store/:storeId/back-image')
  @ApiOperation({ summary: 'View back image' })
  async viewBackImage(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any,
    @Res() res: Response
  ) {
    const identification = await this.storeIdentificationService.findByStoreId(
      storeId,
      req.user.userId
    );
    if (!identification || !identification.img_back) {
      return res.status(404).json({ message: 'Back image not found' });
    }

    const fileData = await this.storeIdentificationService.getFileData(
      identification.img_back,
      req.user.userId
    );

    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `inline; filename="${fileData.filename}"`,
      'Content-Length': fileData.data.length,
    });

    res.end(fileData.data);
  }

  // Cập nhật store identification
  @Patch('store/:storeId')
  @ApiOperation({ summary: 'Update store identification' })
  @ApiResponse({
    status: 200,
    description: 'Store identification updated successfully',
  })
  async update(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() updateDto: UpdateStoreIdentificationDto,
    @Req() req: any
  ) {
    return await this.storeIdentificationService.update(
      storeId,
      updateDto,
      req.user.userId
    );
  }

  // Xóa store identification
  @Delete('store/:storeId')
  @ApiOperation({ summary: 'Delete store identification' })
  @ApiResponse({
    status: 200,
    description: 'Store identification deleted successfully',
  })
  async remove(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    await this.storeIdentificationService.remove(storeId, req.user.userId);
    return { message: 'Store identification deleted successfully' };
  }
}
