// revoked-tokens.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RevokedTokensService {
  constructor(private dataSource: DataSource) {}

  async revoke(token: string, expiresAt: Date) {
    await this.dataSource.query(
      'INSERT INTO revoked_tokens (token, expires_at) VALUES (\$1, \$2)',
      [token, expiresAt],
    );
  }

  async isRevoked(token: string): Promise<boolean> {
    const result = await this.dataSource.query(
      'SELECT 1 FROM revoked_tokens WHERE token = \$1 LIMIT 1',
      [token],
    );
    return result.length > 0;
  }
}
