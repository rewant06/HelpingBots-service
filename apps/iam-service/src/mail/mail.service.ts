import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false, // true for 465, false for 587 (like Ethereal)
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASS'),
      },
    });
    this.from = this.configService.getOrThrow<string>('MAIL_FROM');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"HelpingBots"< ${this.from}>`,
      to: email,
      subject: 'Your Password Reset Request',
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p> Hi There,</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}"> confirm reset </a>`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent: ${info.messageId}`);
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Failed to send password reset email', error.stack);
    }
  }

  async sendWelcomeEmail(email: string, token: string) {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"HelpingBots" <${this.from}>`,
      to: email,
      subject: 'Welcome! Please Verify Your Email',
      text: `Welcome! Click this link to verify your email address: ${verifyUrl}`,
      html: `<p>Welcome!</p><p>Click this link to verify your email address:</p><a href="${verifyUrl}">confirm verification</a>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent: ${info.messageId}`);
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      this.logger.error('Failed to send welcome email', err.stack);
    }
  }
}
