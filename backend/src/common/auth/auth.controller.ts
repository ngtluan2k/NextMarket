import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
