import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ProductReviewsService } from './product_reviews.service';
import { CreateProductReviewDto } from './dto/create-product_review.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/product_review';
          if (!existsSync(uploadPath))
            mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  async create(
    @Req() req: any,
    @Body() dto: CreateProductReviewDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const user = req.user as any;

    // Chuyển files thành media metadata
    const media: { url: string; type: 'image' | 'video' }[] = files?.map(
      (file) => ({
        url: `/uploads/product_review/${file.filename}`,
        type: file.mimetype.startsWith('video')
          ? ('video' as const)
          : ('image' as const),
      })
    );

    return this.reviewsService.create(user.userId, dto, media);
  }

  @Get(':id/reviews')
  async getReviews(
    @Param('id', ParseIntPipe) productId: number,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '5'
  ) {
    const pageNum = parseInt(page, 10);
    const size = parseInt(pageSize, 10);

    const { reviews, total } = await this.reviewsService.getReviews(
      productId,
      pageNum,
      size
    );

    return { data: reviews, total };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':reviewId')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/product_review';
          if (!existsSync(uploadPath))
            mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  async update(
    @Req() req: any,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: { rating?: number; comment?: string },
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const user = req.user as any;
    const media = files?.map((file) => ({
      url: `/uploads/product_review/${file.filename}`,
      type: (file.mimetype.startsWith('video') ? 'video' : 'image') as
        | 'image'
        | 'video',
    }));

    return this.reviewsService.updateReview(user.userId, reviewId, dto, media);
  }
}
