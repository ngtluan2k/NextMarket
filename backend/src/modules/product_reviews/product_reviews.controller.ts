import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ProductReviewsService } from './product_reviews.service';
import { CreateProductReviewDto } from './dto/create-product_review.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';


@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @UseGuards(JwtAuthGuard)
@Post()
async create(@Req() req: any, @Body() dto: CreateProductReviewDto) {
  const user = req.user as any;
  return this.reviewsService.create(user.userId, dto); // 👈 nhớ lấy đúng field
}
}
