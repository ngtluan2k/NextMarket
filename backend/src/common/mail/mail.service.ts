// backend/src/common/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Gmail: dùng App Password
    },
  });

  async send(to: string, subject: string, html: string) {
    const from = process.env.MAIL_FROM || `"EveryMart" <choheo.soss@gmail.com>`;
    await this.transporter.sendMail({ from, to, subject, html });
  }
}
