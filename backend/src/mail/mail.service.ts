import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
    }
  }

  async sendInvite(params: {
    to: string;
    name: string;
    roleLabel: string;
    password: string;
    branchName?: string;
  }) {
    const appUrl = this.config.get('APP_URL') || 'http://localhost:5173';
    const subject = `BiteRush ${params.roleLabel} account`;
    const text = [
      `Hi ${params.name},`,
      '',
      `You have been invited as a ${params.roleLabel} on BiteRush.`,
      params.branchName ? `Branch: ${params.branchName}` : '',
      '',
      `Login: ${appUrl}/login`,
      `Email: ${params.to}`,
      `Temporary password: ${params.password}`,
      '',
      'Please sign in and change your password after your first login.',
    ]
      .filter(Boolean)
      .join('\n');

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — invite email for ${params.to}:\n${text}`,
      );
      return { delivered: false, preview: text };
    }

    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM') || 'BiteRush <noreply@biterush.local>',
      to: params.to,
      subject,
      text,
    });

    return { delivered: true };
  }
}
