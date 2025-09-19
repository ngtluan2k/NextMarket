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
  Query,
  BadRequestException,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response, Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StoreDocumentService } from './store-document.service';
import { CreateStoreDocumentDto, DocumentType } from './dto/create-store-document.dto';
import { UpdateStoreDocumentDto } from './dto/update-store-document.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions } from '../../common/auth/permission.decorator';
import { multerConfig } from './config/multer.config';


@ApiTags('Store Documents')
@Controller('store-documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class StoreDocumentController {
  constructor(private readonly storeDocumentService: StoreDocumentService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload document for store' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (max 10MB, PDF/JPG/PNG)',
        },
        store_information_id: {
          type: 'number',
          description: 'Store information ID',
        },
        doc_type: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Type of document',
        },
      },
      required: ['file', 'store_information_id', 'doc_type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or parameters',
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const createDto: CreateStoreDocumentDto = {
      store_information_id: parseInt(body.store_information_id),
      doc_type: body.doc_type as DocumentType,
      file_url: file?.path || file?.filename, 
    };

    return await this.storeDocumentService.uploadDocument(
      file,
      createDto,
      req.user.id,
    );
  }

  @Get('store/:storeInformationId')
  @ApiOperation({ summary: 'Get all documents for a store' })
  @ApiResponse({
    status: 200,
    description: 'List of store documents',
  })
  async findByStore(
    @Param('storeInformationId', ParseIntPipe) storeInformationId: number,
    @Req() req: any,
  ) {
    return await this.storeDocumentService.findByStoreInformation(
      storeInformationId,
      req.user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document details',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.storeDocumentService.findOne(id, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({
    status: 200,
    description: 'File stream',
  })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const fileData = await this.storeDocumentService.getFileData(id, req.user.id);
    
    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
      'Content-Length': fileData.data.length,
    });

    res.end(fileData.data);
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'View document file in browser' })
  @ApiResponse({
    status: 200,
    description: 'File for viewing',
  })
  async viewFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const fileData = await this.storeDocumentService.getFileData(id, req.user.id);
    
    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `inline; filename="${fileData.filename}"`,
      'Content-Length': fileData.data.length,
    });

    res.end(fileData.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document details' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStoreDocumentDto,
    @Req() req: any,
  ) {
    return await this.storeDocumentService.update(id, updateDto, req.user.id);
  }

  @Post(':id/replace')
  @ApiOperation({ summary: 'Replace document file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New document file',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async replaceDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.storeDocumentService.replaceDocument(
      id,
      file,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.storeDocumentService.remove(id, req.user.id);
    return { message: 'Document deleted successfully' };
  }

  // Admin endpoints
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: Get all documents with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @UseGuards(PermissionGuard)
  @RequirePermissions('manage_documents')
  async findAllDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    
    return await this.storeDocumentService.findAllDocuments(pageNum, limitNum);
  }

  @Post('admin/:id/verify')
  @ApiOperation({ summary: 'Admin: Verify document' })
  @UseGuards(PermissionGuard)
  @RequirePermissions('verify_documents')
  async verifyDocument(@Param('id', ParseIntPipe) id: number) {
    return await this.storeDocumentService.verifyDocument(id);
  }

  @Post('admin/:id/reject')
  @ApiOperation({ summary: 'Admin: Reject document verification' })
  @UseGuards(PermissionGuard)
  @RequirePermissions('verify_documents')
  async rejectDocument(@Param('id', ParseIntPipe) id: number) {
    return await this.storeDocumentService.rejectDocument(id);
  }
}
