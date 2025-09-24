import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreDocument } from './store-document.entity';
import {
  CreateStoreDocumentDto,
  DocumentType,
} from './dto/create-store-document.dto';
import { UpdateStoreDocumentDto } from './dto/update-store-document.dto';
import { StoreInformation } from '../store-information/store-information.entity';
import { Store } from '../store/store.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreDocumentService {
  constructor(
    @InjectRepository(StoreDocument)
    private storeDocumentRepo: Repository<StoreDocument>,
    @InjectRepository(StoreInformation)
    private storeInformationRepo: Repository<StoreInformation>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
  ) { }

  // Upload và tạo document record
  async uploadDocument(
    file: Express.Multer.File,
    createDto: CreateStoreDocumentDto,
    userId: number
  ): Promise<StoreDocument> {
    // Verify user owns the store
    await this.verifyStoreOwnership(createDto.store_information_id, userId);

    // Validate file
    this.validateFile(file, createDto.doc_type);

    // Save file to disk
    const filePath = this.saveFileToDisk(file, createDto.doc_type);

    // Create document record
    const document = this.storeDocumentRepo.create({
      ...createDto,
      file_url: filePath,
      verified: false,
      is_draft: createDto.is_draft ?? false,
    });

    return await this.storeDocumentRepo.save(document);
  }

  // Lấy tất cả documents của một store
  async findByStoreInformation(
    storeInformationId: number,
    userId: number
  ): Promise<StoreDocument[]> {
    // Verify ownership
    await this.verifyStoreOwnership(storeInformationId, userId);

    return await this.storeDocumentRepo.find({
      where: { store_information_id: storeInformationId },
      order: { id: 'DESC' },
    });
  }

  // Lấy document theo ID
  async findOne(id: number, userId: number): Promise<StoreDocument> {
    const document = await this.storeDocumentRepo.findOne({
      where: { id },
      relations: ['storeInformation'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verify ownership through store information
    const store = await this.storeRepo.findOne({
      where: { id: document.storeInformation.store_id },
    });

    if (!store || store.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  // Cập nhật document (chủ yếu cho admin verify)
  async update(
    id: number,
    updateDto: UpdateStoreDocumentDto,
    userId: number
  ): Promise<StoreDocument> {
    const document = await this.findOne(id, userId);

    Object.assign(document, updateDto);

    if (updateDto.verified && !document.verified_at) {
      document.verified_at = new Date();
    }

    return await this.storeDocumentRepo.save(document);
  }

  // Xóa document
  async remove(id: number, userId: number): Promise<void> {
    const document = await this.findOne(id, userId);
    await this.storeDocumentRepo.remove(document);
  }

  // Thay thế document (upload file mới cho document type đã có)
  async replaceDocument(
    documentId: number,
    file: Express.Multer.File,
    userId: number
  ): Promise<StoreDocument> {
    const document = await this.findOne(documentId, userId);

    // Validate new file
    this.validateFile(file, document.doc_type as DocumentType);

    // Delete old file
    if (
      document.file_url &&
      fs.existsSync(path.join(process.cwd(), document.file_url))
    ) {
      fs.unlinkSync(path.join(process.cwd(), document.file_url));
    }

    // Save new file
    const newFilePath = this.saveFileToDisk(
      file,
      document.doc_type as DocumentType
    );

    // Update document
    document.file_url = newFilePath;
    document.verified = false; // Reset verification status
    document.verified_at = null;

    return await this.storeDocumentRepo.save(document);
  }

  // Private methods
  private async verifyStoreOwnership(
    storeInformationId: number,
    userId: number
  ): Promise<void> {
    const storeInfo = await this.storeInformationRepo.findOne({
      where: { id: storeInformationId },
    });

    if (!storeInfo) {
      throw new NotFoundException('Store information not found');
    }

    const store = await this.storeRepo.findOne({
      where: { id: storeInfo.store_id },
    });

    if (!store || store.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this store');
    }
  }

  private validateFile(file: Express.Multer.File, docType: DocumentType): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Allowed file types based on document type
    const allowedTypes = this.getAllowedMimeTypes(docType);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${docType}. Allowed types: ${allowedTypes.join(
          ', '
        )}`
      );
    }
  }

  private getAllowedMimeTypes(docType: DocumentType): string[] {
    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const documentTypes = ['application/pdf', ...imageTypes];

    switch (docType) {
      case DocumentType.BUSINESS_LICENSE:
      case DocumentType.TAX_CERTIFICATE:
      case DocumentType.OTHER:
        return documentTypes; // Cho phép cả ảnh và PDF
      default:
        return documentTypes;
    }
  }

  // Lấy file data để serve
  async getFileData(
    id: number,
    userId: number
  ): Promise<{
    data: Buffer;
    mimetype: string;
    filename: string;
  }> {
    const document = await this.findOne(id, userId);

    // Lấy từ file system
    const fullPath = path.join(process.cwd(), document.file_url);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    const fileData = fs.readFileSync(fullPath);
    const filename = path.basename(document.file_url);

    // Detect MIME type từ file extension
    const ext = path.extname(filename).toLowerCase();
    let mimetype = 'application/octet-stream';

    switch (ext) {
      case '.pdf':
        mimetype = 'application/pdf';
        break;
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

  // Save file to disk
  private saveFileToDisk(
    file: Express.Multer.File,
    docType: DocumentType
  ): string {
    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${docType.toLowerCase()}-${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path for database storage
    return `/uploads/documents/${fileName}`;
  }

  // Admin methods
  async findAllDocuments(
    page = 1,
    limit = 20
  ): Promise<{
    documents: StoreDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [documents, total] = await this.storeDocumentRepo.findAndCount({
      relations: ['storeInformation'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyDocument(id: number): Promise<StoreDocument> {
    const document = await this.storeDocumentRepo.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.verified = true;
    document.verified_at = new Date();

    return await this.storeDocumentRepo.save(document);
  }

  async rejectDocument(id: number): Promise<StoreDocument> {
    const document = await this.storeDocumentRepo.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.verified = false;
    document.verified_at = null;

    return await this.storeDocumentRepo.save(document);
  }
  async storeFileAndGetPath(file: Express.Multer.File, docType: DocumentType): Promise<string> {
    this.validateFile(file, docType);
    return this.saveFileToDisk(file, docType);
  }

  async createFromUrl(dto: CreateStoreDocumentDto, userId: number) {
    await this.verifyStoreOwnership(dto.store_information_id, userId);
    if (!dto.file_url) throw new BadRequestException('file_url is required');

    const document = this.storeDocumentRepo.create({
      ...dto,
      verified: false,
    });

    return await this.storeDocumentRepo.save(document);
  }
}
