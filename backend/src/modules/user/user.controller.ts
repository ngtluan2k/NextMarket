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
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../common/utils/multer.config';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.userService.findAllUsers();
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

    // Tạo JWT
    const payload = {
      sub: userData.id,
      username: userData.username,
      email: userData.email,
      roles: userData.roles,
      permissions: userData.permissions,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      status: 200,
      message: 'Login successful',
      data: payload,
      access_token: token,
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
}
