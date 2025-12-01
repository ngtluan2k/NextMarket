import { Controller, Get, Query, Param, UseGuards, ParseIntPipe, DefaultValuePipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard} from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AffiliateTreeService } from './affiliate-tree.service';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { userId: number; roles?: string[] };
}

@ApiTags('Admin - Affiliate Tree')
@Controller('admin/affiliate-tree')
@UseGuards(JwtAuthGuard, RolesGuard)

export class AffiliateTreeController {
  constructor(private readonly affiliateTreeService: AffiliateTreeService) {}

  @Get('upline')
  @ApiOperation({ summary: 'Lấy danh sách cấp trên của một người dùng' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiQuery({ name: 'maxDepth', required: false, type: Number, description: 'Default is 10' })
  async getAncestors(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('maxDepth', new DefaultValuePipe(10), ParseIntPipe) maxDepth: number,
  ) {
    const ancestorIds = await this.affiliateTreeService.findAncestors(userId, maxDepth);
    return {
      message: 'Lấy danh sách cấp trên thành công',
      data: ancestorIds,
    };
  }

  @Get('downline')
  @ApiOperation({ summary: 'Lấy danh sách cấp dưới trực tiếp của một người dùng (phân trang)' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Default is 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default is 50' })
  async getDownline(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const descendantData = await this.affiliateTreeService.findDescendants(userId, page, limit);
    return {
      message: 'Lấy danh sách cấp dưới thành công',
      ...descendantData,
    };
  }

  @Get('with-commissions/:userId')
  @ApiOperation({ summary: 'Lấy cây affiliate với thông tin commission cho từng user' })
  @ApiQuery({ name: 'maxDepth', required: false, type: Number, description: 'Default is 10' })
  @ApiQuery({ name: 'programId', required: false, type: Number, description: 'Filter by program ID' })
  async getAffiliateTreeWithCommissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('maxDepth', new DefaultValuePipe(10), ParseIntPipe) maxDepth: number,
    @Query('programId') programIdStr?: string,
  ) {
    // Parse programId manually to handle optional case
    const programId = programIdStr ? parseInt(programIdStr, 10) : undefined;
    
    const treeData = await this.affiliateTreeService.getAffiliateTreeWithCommissions(userId, maxDepth, programId);
    return {
      message: 'Lấy cây affiliate với commission thành công',
      data: treeData,
    };
  }

  @Get('commission-summary/:userId')
  @ApiOperation({ summary: 'Lấy tổng kết commission cho một user' })
  async getCommissionSummary(@Param('userId', ParseIntPipe) userId: number) {
    const summary = await this.affiliateTreeService.getCommissionSummaryForUsers([userId]);
    return {
      message: 'Lấy tổng kết commission thành công',
      data: summary.get(userId) || {
        totalEarned: 0,
        totalPending: 0,
        totalPaid: 0,
        ratePercent: 0
      },
    };
  }

  @Get('commission-rules/:level')
  @ApiOperation({ summary: 'Lấy commission rules cho một level' })
  @ApiQuery({ name: 'programId', required: false, type: Number })
  async getCommissionRules(
    @Param('level', ParseIntPipe) level: number,
    @Query('programId') programIdStr?: string,
  ) {
    const programId = programIdStr ? parseInt(programIdStr, 10) : undefined;
    const rules = await this.affiliateTreeService.getCommissionRulesForLevel(level, programId);
    return {
      message: 'Lấy commission rules thành công',
      data: rules,
    };
  }

  // @Post('set-commission-rules')
  // @Roles('Admin')
  // @ApiOperation({ summary: 'Admin quy định mức affiliate cho chuỗi người trong cây' })
  // @ApiBody({ type: SetCommissionRulesDto })
  // async setCommissionRulesForUsers(@Body() dto: SetCommissionRulesDto) {
  //   const results = await this.affiliateTreeService.setCommissionRulesForUsers(dto.rules, dto.programId);
  //   return {
  //     message: 'Cập nhật commission rules thành công',
  //     data: results,
  //   };
  // }

  @Get('commission-rules-for-users')
  @Roles('Admin')
  @ApiOperation({ summary: 'Lấy commission rules cho một chuỗi users' })
  @ApiQuery({ name: 'userIds', required: true, type: String, description: 'Comma-separated user IDs' })
  @ApiQuery({ name: 'programId', required: false, type: Number })
  async getCommissionRulesForUsers(
    @Query('userIds') userIds: string,
    @Query('programId') programIdStr?: string,
  ) {
    const userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const programId = programIdStr ? parseInt(programIdStr, 10) : undefined;
    const rules = await this.affiliateTreeService.getCommissionRulesForUsers(userIdArray, programId);
    return {
      message: 'Lấy commission rules cho users thành công',
      data: rules,
    };
  }

  @Get('full-tree')
  @Roles('Admin')
  @ApiOperation({ summary: 'Lấy toàn bộ cây affiliate từ root node (không filter theo program)' })
  @ApiQuery({ name: 'maxDepth', required: false, type: Number, description: 'Default is 10' })
  async getFullAffiliateTree(
    @Query('maxDepth', new DefaultValuePipe(10), ParseIntPipe) maxDepth: number,
  ) {
    const treeData = await this.affiliateTreeService.getFullAffiliateTree(maxDepth);
    return {
      message: 'Lấy toàn bộ cây affiliate thành công',
      data: treeData,
    };
  }

  @Get('node-details/:userId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Lấy chi tiết user node trong cây affiliate' })
  async getUserTreeNodeDetails(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const nodeDetails = await this.affiliateTreeService.getUserTreeNodeDetails(userId);
    return {
      message: 'Lấy chi tiết user node thành công',
      data: nodeDetails,
    };
  }

  @Get('node-commission/:userId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Lấy thông tin hoa hồng của user node (lazy loaded)' })
  async getNodeCommissionDetails(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const commission = await this.affiliateTreeService.getNodeCommissionDetails(userId);
    return {
      message: 'Lấy thông tin hoa hồng thành công',
      data: commission,
    };
  }
}

/**
 * USER AFFILIATE TREE CONTROLLER
 * Privacy-compliant endpoints for affiliate users to view their downline tree
 */
@ApiTags('User - Affiliate Tree')
@Controller('affiliate-tree')
@UseGuards(JwtAuthGuard)
export class UserAffiliateTreeController {
  constructor(private readonly affiliateTreeService: AffiliateTreeService) {}

  @Get('my-downlines')
  @ApiOperation({ summary: 'Lấy cây downline của user hiện tại (privacy-compliant)' })
  @ApiQuery({ name: 'maxDepth', required: false, type: Number, description: 'Maximum depth (default: 5)' })
  @ApiQuery({ name: 'programId', required: false, type: Number, description: 'Filter by program ID' })
  async getMyDownlines(
    @Request() req: AuthRequest,
    @Query('maxDepth', new DefaultValuePipe(5), ParseIntPipe) maxDepth: number,
    @Query('programId') programIdStr?: string,
  ) {
    const userId = req.user.userId;
    const programId = programIdStr ? parseInt(programIdStr, 10) : undefined;
    
    const treeData = await this.affiliateTreeService.getUserDownlineTree(userId, maxDepth, programId);
    return {
      message: 'Lấy cây downline thành công',
      data: treeData,
    };
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Lấy thống kê affiliate của user hiện tại' })
  async getMyAffiliateStats(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    
    const stats = await this.affiliateTreeService.getUserAffiliateStats(userId);
    return {
      message: 'Lấy thống kê affiliate thành công',
      data: stats,
    };
  }
}