import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RevokedTokensService } from './revoked-tokens.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private revokedTokensService: RevokedTokensService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: '123',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token && await this.revokedTokensService.isRevoked(token)) {
    throw new UnauthorizedException('Token đã bị thu hồi');
  }

  return {
    sub: payload.sub,
    userId: parseInt(payload.sub, 10),
    email: payload.email,
    roles: payload.roles,
    permissions: payload.permissions,
  };
}

}
