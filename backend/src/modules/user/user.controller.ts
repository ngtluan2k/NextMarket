import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUsernameDto } from './dto/update-username.dto';
import {
  RequestRegisterOtpDto,
  VerifyRegisterOtpDto,
} from './dto/register-otp.dto';
import { UploadedFile, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../common/utils/multer.config';
import { RequestPasswordResetDto, ResetPasswordByOtpDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('view_user')
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.userService.findAllUsers();
  }

 @Get('check-admin')
@UseGuards(JwtAuthGuard)
async checkAdmin(@Req() req: any) {
  const user = req.user;
  if (!user) throw new UnauthorizedException('Chưa đăng nhập');

  // chỉ cần check roles
 if (!user.roles || !user.roles.some((r: string) => r.toLowerCase() === 'admin')) {
  throw new UnauthorizedException('Bạn không có quyền admin hoặc chưa đăng nhập');
}
  return {
    status: 200,
    message: 'User is admin',
    data: {
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    },
  };
}


  @Get('search')
  @ApiOperation({ summary: 'Search user by email' })
  @UseGuards(AuthGuard('jwt'))
  async searchUserByEmail(@Query('email') email: string) {
    console.log(`🔍 Searching user by email: ${email}`);
    if (!email || !email.trim()) {
      throw new Error('Email parameter is required');
    }
    
    const user = await this.userService.findByEmail(email.trim());
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      throw new Error('User not found');
    }
    
    console.log(`✅ Found user:`, { id: user.id, email: user.email, username: user.username });
    return user;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() dto: CreateUserDto) {
    const user = await this.userService.register(dto);
    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    
    const userData = await this.userService.login(dto);
  
    return {
      status: 200,
      message: 'Login successful',
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        is_affiliate: userData.is_affiliate,
        roles: userData.roles,
        permissions: userData.permissions,
        profile: userData.profile,
        
      },
      access_token: userData.access_token,
    };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile by user ID' })
  @ApiBearerAuth()
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    const profile = await this.userService.getProfile(id);
    return {
      status: 200,
      message: 'Get profile successful',
      data: profile,
    };
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile by user ID' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserProfileDto })
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserProfileDto
  ) {
    const updated = await this.userService.updateProfile(id, dto);
    return {
      status: 200,
      message: 'Update profile successful',
      data: updated,
    };
  }
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile from JWT' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    // req.user được gán trong JwtStrategy.validate()
    const userId = req.user.userId; // phải đảm bảo JwtStrategy trả về userId
    const profile = await this.userService.getProfile(userId);
    return {
      status: 200,
      message: 'Get current user profile successful',
      data: profile,
    };
  }

  @Put(':id/username')
  async updateUsername(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsernameDto
  ) {
    const data = await this.userService.updateUsername(id, dto);
    return { status: 200, message: 'Username updated', data };
  }

  @Post('register/request-otp')
  @ApiOperation({ summary: 'Request OTP for email verification' })
  async requestRegisterOtp(@Body() dto: RequestRegisterOtpDto) {
    await this.userService.requestRegisterOtp(dto.email);
    return { message: 'OTP đã được gửi tới email' };
  }

  @Post('register/verify')
  @ApiOperation({ summary: 'Verify OTP and create account' })
  async verifyRegisterOtp(@Body() dto: VerifyRegisterOtpDto) {
    const user = await this.userService.verifyRegisterOtp(dto);
    return { message: 'Tạo tài khoản thành công', data: user };
  }
  @Post(':id/upload-avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      return { status: 400, message: 'No file provided' };
    }
    const currentUserId = req.user?.userId ?? req.user?.sub;
    const data = await this.userService.uploadAvatar(id, currentUserId, file);
    return { status: 200, message: 'Avatar uploaded', data };
  }

  @Get(':id/is-affiliate')
  @ApiOperation({ summary: 'Check if user is an affiliate by ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async checkIsAffiliate(@Param('id', ParseIntPipe) id: number) {
    const isAffiliate = await this.userService.isUserAffiliate(id);
    return {
      status: 200,
      message: 'Affiliate status checked',
      data: { is_affiliate: isAffiliate },
    };
  }

  @Post('password/forgot')
  @ApiOperation({ summary: 'Gửi OTP đặt lại mật khẩu vào email' })
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    return this.userService.requestPasswordReset(dto);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Xác thực OTP và đổi mật khẩu' })
  async resetPassword(@Body() dto: ResetPasswordByOtpDto) {
    return this.userService.resetPasswordByOtp(dto);
  }
  @Post('password/verify-otp')
  async verifyPasswordOtp(@Body() dto: { email: string; code: string }) {
    return this.userService.verifyPasswordOtp(dto);
  }
}
