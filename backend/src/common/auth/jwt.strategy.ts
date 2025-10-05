// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 👈 lấy token từ header
      ignoreExpiration: false,
      secretOrKey: '123', // 👈 giống secret ở JwtModule
    });
  }

  async validate(payload: any) {
    console.log('JWT payload:', payload);
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
