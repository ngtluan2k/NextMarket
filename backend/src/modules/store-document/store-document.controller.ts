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
  constructor(private readonly storeDocumentService: StoreDocumentService) { }
  //Upload file cho cửa hàng.
  @Post('upload-file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        doc_type: { type: 'string', enum: Object.values(DocumentType) },
      },
      required: ['file', 'doc_type'],
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
  async uploadFileOnly(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const path = await this.storeDocumentService.storeFileAndGetPath(file, body.doc_type as DocumentType);
    return { file_url: path };
  }

  @Post()
  async createFromUrl(@Body() dto: CreateStoreDocumentDto, @Req() req: any) {
    return this.storeDocumentService.createFromUrl(dto, req.user.id);
  }
  // /Lấy danh sách tất cả tài liệu của 1 cửa hàng.
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
  //Lấy chi tiết 1 document theo id.
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
  //Download file document.
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
  //Xem file document trực tiếp trên trình duyệt.
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
  //Cập nhật thông tin document (không đổi file).
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
  //Thay thế file cũ bằng file mới.
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
  //Xóa document.
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

  // Admin xem tất cả document với phân trang.
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
  //Admin xác nhận document hợp lệ.
  @Post('admin/:id/verify')
  @ApiOperation({ summary: 'Admin: Verify document' })
  @UseGuards(PermissionGuard)
  @RequirePermissions('verify_documents')
  async verifyDocument(@Param('id', ParseIntPipe) id: number) {
    return await this.storeDocumentService.verifyDocument(id);
  }
  //Admin từ chối document.
  @Post('admin/:id/reject')
  @ApiOperation({ summary: 'Admin: Reject document verification' })
  @UseGuards(PermissionGuard)
  @RequirePermissions('verify_documents')
  async rejectDocument(@Param('id', ParseIntPipe) id: number) {
    return await this.storeDocumentService.rejectDocument(id);
  }
}
