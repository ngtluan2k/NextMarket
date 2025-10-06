import { Controller, Post, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { StoreFollowersService } from './store-followers.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('store-followers')
@ApiBearerAuth('access-token')
@Controller('store-followers')
export class StoreFollowersController {
  constructor(private readonly service: StoreFollowersService) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Theo dõi store' })
  async follow(@Param('id') id: string, @Req() req: any) {
    const data = await this.service.follow(req.user.userId, Number(id));
    return { message: 'Followed', data };
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bỏ theo dõi store' })
  async unfollow(@Param('id') id: string, @Req() req: any) {
    const data = await this.service.unfollow(req.user.userId, Number(id));
    return { message: 'Unfollowed', data };
  }

  @Post(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bật/tắt theo dõi' })
  async toggle(@Param('id') id: string, @Req() req: any) {
    const data = await this.service.toggle(req.user.userId, Number(id));
    return { message: data.followed ? 'Followed' : 'Unfollowed', data };
  }

  @Get(':id/count')
  @ApiOperation({ summary: 'Đếm số follower' })
  async count(@Param('id') id: string) {
    const data = await this.service.count(Number(id));
    return { message: 'Followers count', data };
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra đã theo dõi hay chưa' })
  async isFollowing(@Param('id') id: string, @Req() req: any) {
    const data = await this.service.isFollowing(req.user.userId, Number(id));
    return { message: 'Following status', data };
  }
}