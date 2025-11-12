// backend/src/common/otp/otp.service.ts
import { Injectable } from '@nestjs/common';

type OtpRecord = { code: string; expiresAt: number; attempts: number };

@Injectable()
export class OtpService {
  private store = new Map<string, OtpRecord>();
  private ttlMs = 2 * 60 * 1000; // 2 phút
  private maxAttempts = 5;

  generate(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.store.set(email, {
      code,
      expiresAt: Date.now() + this.ttlMs,
      attempts: 0,
    });
    return code;
  }

  verify(key: string, code: string): boolean {
  const rec = this.store.get(key);
  console.log('VERIFY:', key, rec, code);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    this.store.delete(key);
    return false;
  }
  if (rec.attempts >= this.maxAttempts) return false;
  if (rec.code !== code) {
    rec.attempts += 1;
    this.store.set(key, rec);
    return false;
  }

  // ✅ Đừng xóa ở đây nữa, để resetPasswordByOtp xóa sau
  // this.store.delete(key);
  return true;
}


  clear(email: string) {
    this.store.delete(email);
  }
}
