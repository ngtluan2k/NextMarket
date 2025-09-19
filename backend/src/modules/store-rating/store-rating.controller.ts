import { Controller,Get,Post,Put,Delete,Param,Body,UseGuards,Req,Query,ParseIntPipe } from '@nestjs/common';
import { StoreRatingService } from './store-rating.service';
import { RateStoreDto } from './dto/rate-store.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('store-ratings')
@ApiBearerAuth('access-token')
@Controller('store-ratings')
@UseGuards(JwtAuthGuard)
export class StoreRatingController {
  constructor(private readonly ratingService: StoreRatingService) {}

  @Post('stores/:storeId')
  @ApiOperation({ summary: 'Rate a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to rate' })
  async rateStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: RateStoreDto,
    @Req() req: any
  ) {
    const rating = await this.ratingService.createRating(req.user.sub, storeId, dto);
    return {
      message: 'Store rated successfully',
      data: rating,
    };
  }

  @Put('stores/:storeId')
  @ApiOperation({ summary: 'Update your rating for a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to update rating' })
  async updateRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: UpdateRatingDto,
    @Req() req: any
  ) {
    const rating = await this.ratingService.updateRating(req.user.sub, storeId, dto);
    return {
      message: 'Rating updated successfully',
      data: rating,
    };
  }

  @Delete('stores/:storeId')
  @ApiOperation({ summary: 'Delete your rating for a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to delete rating' })
  async deleteRating(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    await this.ratingService.deleteRating(req.user.sub, storeId);
    return {
      message: 'Rating deleted successfully',
    };
  }

  @Get('stores/:storeId')
  @ApiOperation({ summary: 'Get all ratings for a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to get ratings' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  async getStoreRatings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const ratings = await this.ratingService.getStoreRatings(storeId, page, limit);
    return {
      message: 'Store ratings retrieved successfully',
      ...ratings,
    };
  }

  @Get('stores/:storeId/stats')
  @ApiOperation({ summary: 'Get rating statistics for a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to get stats' })
  async getStoreRatingStats(@Param('storeId', ParseIntPipe) storeId: number) {
    const stats = await this.ratingService.getStoreRatingStats(storeId);
    return {
      message: 'Store rating statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('stores/:storeId/my-rating')
  @ApiOperation({ summary: 'Get my rating for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store ID to get my rating' })
  async getMyRatingForStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    const rating = await this.ratingService.getUserRatingForStore(req.user.sub, storeId);
    return {
      message: rating ? 'Your rating retrieved successfully' : 'You have not rated this store yet',
      data: rating,
    };
  }

  @Get('my-ratings')
  @ApiOperation({ summary: 'Get all my ratings' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  async getMyRatings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: any
  ) {
    const ratings = await this.ratingService.getUserRatings(req.user.sub, page, limit);
    return {
      message: 'Your ratings retrieved successfully',
      ...ratings,
    };
  }

  @Get('top-rated-stores')
  @ApiOperation({ summary: 'Get top rated stores' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of stores to return', example: 10 })
  async getTopRatedStores(@Query('limit') limit: number = 10) {
    const stores = await this.ratingService.getTopRatedStores(limit);
    return {
      message: 'Top rated stores retrieved successfully',
      data: stores,
    };
  }
}