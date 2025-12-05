import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AffiliateProgramsService } from './affiliate-program.service';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { UpdateAffiliateProgramDto } from './dto/update-affiliate-program.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions } from '../../common/auth/permission.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BudgetTrackingService } from './service/budget-tracking.service';

@ApiTags('affiliate-programs')
@Controller('affiliate-programs')
export class AffiliateProgramsController {
  constructor(
    private readonly service: AffiliateProgramsService,
    private readonly budgetService: BudgetTrackingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Create a new affiliate program' })
  create(@Body() createDto: CreateAffiliateProgramDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active affiliate programs' })
  findAllActive() {
    return this.service.findAllActive();
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Get all affiliate programs' })
  findAllForAdmin() {
    return this.service.findAll();
  }

  @Get('manage/with-counts')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Get all affiliate programs with user enrollment counts' })
  findAllWithUserCounts() {
    return this.service.findAllWithUserCounts();
  }

  @Get('active/with-counts')
  @ApiOperation({ summary: 'Get all active affiliate programs with user enrollment counts' })
  findAllActiveWithUserCounts() {
    return this.service.findAllActiveWithUserCounts();
  }

  @Get('active/with-rules')
  @ApiOperation({ summary: 'Get all active affiliate programs that have commission rules' })
  findAllActiveWithRules() {
    return this.service.findAllActiveWithRules();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an affiliate program by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post('delete/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Soft delete an affiliate program (status change only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.manageStatus(id, 'delete');
  }

  @Post('reopen/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Reopen a deleted affiliate program' })
  async reopen(@Param('id', ParseIntPipe) id: number) {
    return this.service.manageStatus(id, 'reopen');
  }

  @Delete('hard-delete/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Permanently delete an affiliate program and all associated data' })
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.hardDelete(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Update an affiliate program' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAffiliateProgramDto
  ) {
    return this.service.update(id, updateDto);
  }

  // Budget Management APIs
  @Get(':id/budget-status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Get budget status for a program' })
  async getBudgetStatus(@Param('id', ParseIntPipe) id: number) {
    return this.budgetService.getBudgetStatus(id);
  }

  @Get('budget/alerts')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '(Admin) Get programs near budget limit' })
  async getBudgetAlerts() {
    return this.budgetService.getProgramsNearBudgetLimit();
  }
}
