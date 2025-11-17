import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { FraudDetectionService } from '../service/fraud-detection.service';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../../common/auth/permission.guard';
import { RequirePermissions } from '../../../common/auth/permission.decorator';

@Controller('affiliate-fraud')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FraudDetectionController {
  constructor(private readonly fraudService: FraudDetectionService) {}

  @Get('logs')
  @RequirePermissions('manage_affiliate')
  async getFraudLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const result = await this.fraudService.getFraudLogs(page, limit);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch fraud logs',
      };
    }
  }

  @Post('review/:id')
  @RequirePermissions('manage_affiliate')
  async reviewFraudLog(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      action: 'IGNORE' | 'BAN_USER' | 'SUSPEND_AFFILIATE';
      notes?: string;
    },
    @Request() req: any,
  ) {
    try {
      const adminUserId = req.user.id;
      const result = await this.fraudService.reviewFraudLog(
        id,
        body.action,
        adminUserId,
        body.notes,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to review fraud log',
      };
    }
  }
}
