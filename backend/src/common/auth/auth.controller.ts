import { Controller, Get, Req, Res, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RevokedTokensService } from './revoked-tokens.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly revokedTokensService: RevokedTokensService
  ) {}

  @Post('logout')
  @UseGuards(JwtAuthGuard) // Chỉ user đã login mới logout được
  async logout(@Req() req: Request, @Res() res: Response) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Giả sử JWT hết hạn sau 1h (hoặc lấy từ payload nếu bạn có)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.revokedTokensService.revoke(token, expiresAt);

    return res.json({ message: 'Logout thành công, token đã bị thu hồi' });
  }

  // Bước 1: redirect sang Google login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport tự handle
  }

  // Bước 2: callback từ Google
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Res() res: Response, @Req() req: any) {
    const jwt = await this.authService.googleLogin(req.user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    const script = `
      <script>
        if (window.opener) {
          // Gửi dữ liệu về FE
          window.opener.postMessage(${JSON.stringify(jwt)}, "${frontendUrl}");
          window.close();
        } else {
          // Fallback: redirect về FE kèm token
          window.location.href = "${frontendUrl}/home?token=${
      jwt.access_token
    }";
        }
      </script>
    `;

    res.send(script);
  }
}
