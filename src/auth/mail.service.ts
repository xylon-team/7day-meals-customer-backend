import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter?: nodemailer.Transporter;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });
    }
    return this.transporter;
  }

  async sendOtpEmail(toEmail: string, otp: string): Promise<void> {
    const from = process.env.SMTP_FROM ?? 'no-reply@7day-meals.com';
    try {
      await this.getTransporter().sendMail({
        from,
        to: toEmail,
        subject: 'Your 7Day Meals password reset code',
        text: `Your password reset code is ${otp}. It expires in 5 minutes. If you did not request a reset, you can ignore this email.`,
        html: `<p>Your password reset code is <strong>${otp}</strong>.</p>
               <p>It expires in 5 minutes.</p>
               <p>If you did not request a reset, you can ignore this email.</p>`,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to send reset email: An unexpected error occurred',
      );
    }
  }
}
