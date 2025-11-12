// revoked-tokens.module.ts
import { Module } from '@nestjs/common';
import { RevokedTokensService } from './revoked-tokens.service';

@Module({
  providers: [RevokedTokensService],
  exports: [RevokedTokensService], // 👈 export để dùng ở module khác
})
export class RevokedTokensModule {}
