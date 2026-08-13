import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly appName = 'Gym Track';

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL'),
        pass: this.configService.get<string>('EMAIL_APP_PASSWORD'),
      },
    });
  }

  private buildEmailLayout(options: { title: string; subtitle: string; bodyHtml: string }) {
    const { title, subtitle, bodyHtml } = options;

    return `
      <div style="margin:0; padding:24px 12px; background:#121212; font-family:Arial,Helvetica,sans-serif; color:#f3f4f6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:#1f2937; border:1px solid #374151; border-radius:16px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding:20px 24px; color:#ffffff;">
              <p style="margin:0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.9;">${this.appName}</p>
              <h1 style="margin:8px 0 0; font-size:22px; line-height:1.3;">${title}</h1>
              <p style="margin:8px 0 0; font-size:14px; color:#93c5fd;">${subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px; border-top:1px solid #374151; color:#9ca3af; font-size:12px;">
              This is an automated message from ${this.appName}. Please do not reply.
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  private buildPasswordResetEmailHtml(otp: string) {
    return this.buildEmailLayout({
      title: 'Password Reset Code',
      subtitle: 'Use this one-time code to reset your password.',
      bodyHtml: `
        <p style="margin:0 0 12px; font-size:14px; color:#d1d5db;">Use the code below to reset your password:</p>
        <div style="margin:18px 0; padding:14px 16px; text-align:center; background:#111827; border:1px solid #374151; border-radius:12px;">
          <span style="font-size:30px; font-weight:700; letter-spacing:6px; color:#60a5fa;">${otp}</span>
        </div>
        <p style="margin:0 0 8px; font-size:13px; color:#9ca3af;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="margin:0; font-size:13px; color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetOtpEmail(recipientEmail: string, otp: string) {
    const fromEmail = this.configService.get<string>('EMAIL');
    await this.transporter.sendMail({
      from: `"${this.appName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: 'Password Reset Code',
      html: this.buildPasswordResetEmailHtml(otp),
    });
  }

  private buildPasswordResetSuccessEmailHtml() {
    return this.buildEmailLayout({
      title: 'Password Reset Successful',
      subtitle: 'Your account password was changed successfully.',
      bodyHtml: `
        <p style="margin:0 0 10px; font-size:14px; color:#d1d5db;">Your account password was changed successfully.</p>
        <p style="margin:0 0 10px; font-size:14px; color:#d1d5db;">If you made this change, no further action is needed.</p>
        <div style="margin:16px 0 0; padding:12px 14px; border-left:3px solid #60a5fa; background:#111827; border-radius:8px;">
          <p style="margin:0; font-size:13px; color:#9ca3af;">If you did not reset your password, secure your account immediately.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetSuccessEmail(recipientEmail: string) {
    const fromEmail = this.configService.get<string>('EMAIL');
    await this.transporter.sendMail({
      from: `"${this.appName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: 'Password Reset Successful',
      html: this.buildPasswordResetSuccessEmailHtml(),
    });
  }
}
