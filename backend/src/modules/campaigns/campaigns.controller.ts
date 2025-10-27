import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UseGuards, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { RegisterCampaignStoreDto } from './dto/register-campaign.dto';
import { ForbiddenException } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';
import { PublishCampaignDto } from './dto/campaign-publish.dto';
import { NotFoundException } from '@nestjs/common';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  /////////////////////////////////////////////ADMIN ROUTES/////////////////////////////////////////
  @Get('public/:id')
  async getCampaign(@Param('id', ParseIntPipe) id: number) {
    const campaign = await this.campaignsService.getCampaignForUser(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }
  @Get('active')
  async getCurrentlyActiveCampaigns() {
    return this.campaignsService.getCurrentlyActiveCampaigns();
  }
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('banner', 1, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/banners';
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
  @Post()
  async createCampaign(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
    @Req() req: any
  ) {
    // Parse JSON nếu gửi qua FormData
    if (dto.startsAt) dto.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) dto.endsAt = new Date(dto.endsAt);

    // Nếu upload file thì gán URL banner
    if (files?.length) {
      dto.bannerUrl = `/uploads/banners/${files[0].filename}`;
    }

    if (!req.user.roles.includes('Admin')) {
      throw new ForbiddenException('Chỉ admin mới tạo campaign');
    }
    const adminId = req.user.sub;
    return this.campaignsService.createCampaign(dto, adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllCampaigns(@Req() req: any) {
    // Chỉ admin mới xem được
    if (!req.user.roles.includes('Admin')) {
      throw new ForbiddenException('Chỉ admin mới xem được');
    }
    return this.campaignsService.getAllCampaigns();
  }

  @Patch('campaign-stores/:id/approve')
  @UseGuards(JwtAuthGuard) // chỉ cho admin
  async approve(@Param('id') id: number) {
    return this.campaignsService.approveStore(id);
  }

  // ❌ Từ chối store
  @Patch('campaign-stores/:id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: number, @Body('reason') reason: string) {
    return this.campaignsService.rejectStore(id, reason);
  }

  @Get(':campaignId/stores/:storeId')
  async getStoreDetail(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Param('storeId', ParseIntPipe) storeId: number
  ) {
    return this.campaignsService.getCampaignStoreDetail(campaignId, storeId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('banners', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/banners';
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
  async publishCampaign(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: any
  ) {
    const campaignId = parseInt(id, 10);
    const currentUser = req.user;

    if (!currentUser.roles.includes('Admin')) {
      throw new Error('Chỉ admin mới publish campaign');
    }

    // Gộp tất cả dữ liệu vào DTO
    const dto: PublishCampaignDto = {
      campaignId,
      images: files.map((file, idx) => ({
        file,
        position: body.positions?.[idx],
        link_url: body.linkUrls?.[idx],
      })),
      sections: body.sections,
      vouchers: body.vouchers,
    };

    return this.campaignsService.publishCampaign(dto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/products')
  async getCampaignProducts(
    @Param('id', ParseIntPipe) campaignId: number,
    @Req() req: any
  ) {
    if (!req.user.roles.includes('Admin')) {
      throw new ForbiddenException(
        'Chỉ admin mới xem được danh sách sản phẩm trong campaign'
      );
    }

    return this.campaignsService.getCampaignProducts(campaignId);
  }

  @UseGuards(JwtAuthGuard) // chỉ admin mới truy cập
  @Get(':id')
  async getCampaignDetail(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.getCampaignDetail(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('banners', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/banners';
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
  async updateCampaign(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: any
  ) {
    const campaignId = parseInt(id, 10);
    const currentUser = req.user;

    if (!currentUser.roles.includes('Admin')) {
      throw new Error('Chỉ admin mới được phép cập nhật campaign');
    }

    // Gộp dữ liệu thành DTO
    const dto: UpdateCampaignDto = {
      campaignId,
      name: body.name,
      description: body.description,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      bannerUrl: body.bannerUrl,
      status: body.status,
      backgroundColor: body.backgroundColor,
      images: files?.map((file, idx) => ({
        file,
        position: body.positions?.[idx],
        link_url: body.linkUrls?.[idx],
      })),
      sections: body.sections ? JSON.parse(body.sections) : undefined,
      vouchers: body.vouchers ? JSON.parse(body.vouchers) : undefined,
      storeProducts: body.storeProducts
        ? JSON.parse(body.storeProducts)
        : undefined,
      removedImages: body.removedImages
        ? JSON.parse(body.removedImages)
        : undefined,
    };

    return this.campaignsService.updateCampaign(dto, currentUser);
  }

  /////////////////////////////////////////STORE ROUTES/////////////////////////////////////////

  @UseGuards(JwtAuthGuard)
  @Get('campaign-stores/pending')
  async getActiveCampaigns() {
    return this.campaignsService.getPendingCampaigns();
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaign-stores/register/:campaignId')
  async registerStore(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body()
    body: {
      items: { productId: number; variantId?: number; promoPrice?: number }[];
    },
    @Req() req: any
  ) {
    const userId = req.user.sub;
    const dto: RegisterCampaignStoreDto = { campaignId, items: body.items };
    return this.campaignsService.registerStoreForCampaign(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaign-stores/:campaignId/detail')
  async getCampaignDetailForStore(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Req() req: any
  ) {
    const userId = req.user.sub;
    return this.campaignsService.getCampaignDetailForStore(campaignId, userId);
  }

  ////////////////////////////////////////////USER ROUTES/////////////////////////////////////////
}
