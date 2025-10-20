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

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  /////////////////////////////////////////////ADMIN ROUTES/////////////////////////////////////////

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
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.campaignsService.getCampaignStoreDetail(campaignId, storeId);
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

  @Get('active')
  async getCurrentlyActiveCampaigns() {
    return this.campaignsService.getCurrentlyActiveCampaigns();
  }
}
