import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';


@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
  const payload = { sub: userData.id, username: userData.username, email: userData.email, roles: userData.roles, permissions: userData.permissions };
  const token = await this.jwtService.signAsync(payload);

  return {
    status: 200,
    message: 'Login successful',
    data: payload,
    access_token: token,
  };
}

}
