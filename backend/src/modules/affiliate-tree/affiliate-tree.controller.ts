import { Controller, Get, Post, Body, Query, Param, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard} from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AffiliateTreeService } from './affiliate-tree.service';
import { SetCommissionRulesDto } from './dto/set-commission-rules.dto';

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
  async getAffiliateTreeWithCommissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('maxDepth', new DefaultValuePipe(10), ParseIntPipe) maxDepth: number,
  ) {
    const treeData = await this.affiliateTreeService.getAffiliateTreeWithCommissions(userId, maxDepth);
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
    @Query('programId', ParseIntPipe) programId?: number,
  ) {
    const rules = await this.affiliateTreeService.getCommissionRulesForLevel(level, programId);
    return {
      message: 'Lấy commission rules thành công',
      data: rules,
    };
  }

  @Post('set-commission-rules')
  @Roles('Admin')
  @ApiOperation({ summary: 'Admin quy định mức affiliate cho chuỗi người trong cây' })
  @ApiBody({ type: SetCommissionRulesDto })
  async setCommissionRulesForUsers(@Body() dto: SetCommissionRulesDto) {
    const results = await this.affiliateTreeService.setCommissionRulesForUsers(dto.rules, dto.programId);
    return {
      message: 'Cập nhật commission rules thành công',
      data: results,
    };
  }

  @Get('commission-rules-for-users')
  @Roles('Admin')
  @ApiOperation({ summary: 'Lấy commission rules cho một chuỗi users' })
  @ApiQuery({ name: 'userIds', required: true, type: String, description: 'Comma-separated user IDs' })
  @ApiQuery({ name: 'programId', required: false, type: Number })
  async getCommissionRulesForUsers(
    @Query('userIds') userIds: string,
    @Query('programId', ParseIntPipe) programId?: number,
  ) {
    const userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const rules = await this.affiliateTreeService.getCommissionRulesForUsers(userIdArray, programId);
    return {
      message: 'Lấy commission rules cho users thành công',
      data: rules,
    };
  }
}