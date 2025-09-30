// backend/src/common/otp/otp.service.ts
import { Injectable } from '@nestjs/common';

type OtpRecord = { code: string; expiresAt: number; attempts: number };

@Injectable()
export class OtpService {
  private store = new Map<string, OtpRecord>();
  private ttlMs = 10 * 60 * 1000; // 10 phút
  private maxAttempts = 5;

  generate(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.store.set(email, { code, expiresAt: Date.now() + this.ttlMs, attempts: 0 });
    return code;
  }

  verify(email: string, code: string): boolean {
    const rec = this.store.get(email);
    if (!rec) return false;
    if (Date.now() > rec.expiresAt) {
      this.store.delete(email);
      return false;
    }
    if (rec.attempts >= this.maxAttempts) return false;
    if (rec.code !== code) {
      rec.attempts += 1;
      this.store.set(email, rec);
      return false;
    }
    this.store.delete(email);
    return true;
  }

  clear(email: string) {
    this.store.delete(email);
  }
}