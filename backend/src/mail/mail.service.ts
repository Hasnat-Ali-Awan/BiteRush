import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const service = this.config.get<string>('SMTP_SERVICE')?.trim();
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const rawPass = this.config.get<string>('SMTP_PASS')?.trim();
    const pass = rawPass?.replace(/\s+/g, '');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const secure =
      this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;

    if (user && pass) {
      if (service) {
        this.transporter = nodemailer.createTransport({
          service,
          auth: { user, pass },
        });
      } else if (host) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
      }
    }

    if (this.transporter) {
      this.logger.log(
        `SMTP transporter initialized (${service ? `service: ${service}` : `host: ${host}:${port}`}, user: ${user})`,
      );
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be logged to console in development mode.',
      );
    }
  }

  private get from(): string {
    return (
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      'BiteRush <noreply@biterush.local>'
    );
  }

  private get appUrl(): string {
    return this.config.get<string>('APP_URL') || 'http://localhost:5173';
  }

  async sendVerificationEmail(params: {
    to: string;
    name: string;
    code: string;
    token: string;
  }) {
    const verifyUrl = `${this.appUrl}/verify-email?token=${encodeURIComponent(
      params.token,
    )}&email=${encodeURIComponent(params.to)}`;
    const subject = `🔐 ${params.code} is your BiteRush verification code`;

    const text = [
      `Hi ${params.name},`,
      '',
      `Welcome to BiteRush!`,
      `Your 6-digit email verification code is: ${params.code}`,
      '',
      `Or click the link below to verify your email address:`,
      verifyUrl,
      '',
      '⏱️ This code and link will expire in 15 minutes.',
      'If you did not request this, please safely ignore this email.',
    ].join('\n');

    const html = this.renderTemplate({
      badge: 'SECURITY VERIFICATION',
      badgeColor: '#ea580c',
      iconEmoji: '🛡️',
      title: 'Verify Your Email Address',
      greeting: `Hi ${params.name},`,
      body: 'Welcome to <strong>BiteRush</strong>! Please verify your email to activate your account, order your favorite food, or manage your restaurant.',
      code: params.code,
      codeLabel: 'Your 6-Digit Verification Code',
      codeExpiry: 'Expires in 15 minutes',
      actionText: 'Verify Email Address →',
      actionUrl: verifyUrl,
      note: 'If you did not create an account on BiteRush, you can safely ignore this email. No action is needed.',
    });

    return this.deliverMail({
      to: params.to,
      subject,
      text,
      html,
      devLabel: 'Email Verification',
      devExtra: `Code: ${params.code}\nVerification Link: ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    code: string;
    token: string;
  }) {
    const resetUrl = `${this.appUrl}/reset-password?token=${encodeURIComponent(
      params.token,
    )}&email=${encodeURIComponent(params.to)}`;
    const subject = `🔑 ${params.code} is your BiteRush password reset code`;

    const text = [
      `Hi ${params.name},`,
      '',
      `We received a request to reset your BiteRush password.`,
      `Your 6-digit reset code is: ${params.code}`,
      '',
      `Or click the link below to choose a new password:`,
      resetUrl,
      '',
      '⏱️ This code and link will expire in 15 minutes.',
      'If you did not request a password reset, you can safely ignore this email.',
    ].join('\n');

    const html = this.renderTemplate({
      badge: 'ACCOUNT RECOVERY',
      badgeColor: '#f97316',
      iconEmoji: '🔐',
      title: 'Reset Your Password',
      greeting: `Hi ${params.name},`,
      body: 'We received a request to reset the password for your BiteRush account. Use the one-time code below or click the button to set a new password.',
      code: params.code,
      codeLabel: 'Your 6-Digit Password Reset Code',
      codeExpiry: 'Expires in 15 minutes',
      actionText: 'Reset My Password →',
      actionUrl: resetUrl,
      note: 'If you did not request a password reset, please ignore this email or review your account security.',
    });

    return this.deliverMail({
      to: params.to,
      subject,
      text,
      html,
      devLabel: 'Password Reset',
      devExtra: `Code: ${params.code}\nReset Link: ${resetUrl}`,
    });
  }

  async sendInvite(params: {
    to: string;
    name: string;
    roleLabel: string;
    password: string;
    branchName?: string;
  }) {
    const loginUrl = `${this.appUrl}/login`;
    const subject = `🚀 You're invited to BiteRush (${params.roleLabel})`;
    const text = [
      `Hi ${params.name},`,
      '',
      `You have been invited as a ${params.roleLabel} on BiteRush.`,
      params.branchName ? `Branch: ${params.branchName}` : '',
      '',
      `Login URL: ${loginUrl}`,
      `Email: ${params.to}`,
      `Temporary password: ${params.password}`,
      '',
      'Please sign in and change your password after your first login.',
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.renderTemplate({
      badge: 'STAFF INVITATION',
      badgeColor: '#ea580c',
      iconEmoji: '✨',
      title: "You're Invited to BiteRush!",
      greeting: `Hi ${params.name},`,
      body: `You have been granted access to BiteRush as a <strong>${params.roleLabel}</strong>${
        params.branchName ? ` for <strong>${params.branchName}</strong>` : ''
      }. Here are your credentials to get started:`,
      code: params.password,
      codeLabel: 'Temporary Password',
      codeExpiry: 'Change after first sign-in',
      actionText: 'Sign In to Your Portal →',
      actionUrl: loginUrl,
      note: 'For security reasons, please log in and update your password immediately.',
    });

    return this.deliverMail({
      to: params.to,
      subject,
      text,
      html,
      devLabel: 'Staff Invite',
      devExtra: `Role: ${params.roleLabel}\nTemp Password: ${params.password}\nLogin URL: ${loginUrl}`,
    });
  }

  private async deliverMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    devLabel: string;
    devExtra: string;
  }) {
    if (!this.transporter) {
      this.logger.warn(
        `\n========================================\n[MAIL PREVIEW - ${options.devLabel}]\nTo: ${options.to}\nSubject: ${options.subject}\n${options.devExtra}\n========================================`,
      );
      return { delivered: false, preview: options.text };
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email delivered to ${options.to} (${options.subject})`);
      return { delivered: true };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private renderTemplate(data: {
    badge: string;
    badgeColor?: string;
    iconEmoji?: string;
    title: string;
    greeting: string;
    body: string;
    code?: string;
    codeLabel?: string;
    codeExpiry?: string;
    actionText?: string;
    actionUrl?: string;
    note?: string;
  }): string {
    const primaryColor = data.badgeColor || '#ea580c';

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${data.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-card {
        padding: 24px 18px !important;
        border-radius: 16px !important;
      }
      .code-display {
        font-size: 30px !important;
        letter-spacing: 5px !important;
      }
      .cta-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; background-image: radial-gradient(circle at top center, #1e1310 0%, #09090b 70%); padding: 48px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table class="email-card" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 540px; background-color: #12131c; border-radius: 24px; border: 1px solid #232533; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 50px -10px rgba(234, 88, 12, 0.15); padding: 36px 32px;">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(249, 115, 22, 0.08) 100%); border: 1px solid rgba(234, 88, 12, 0.35); border-radius: 999px; padding: 6px 18px;">
                    <span style="font-size: 15px; vertical-align: middle;">⚡</span>
                    <span style="font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: 1px; vertical-align: middle; margin-left: 4px;">BITE<span style="color: #ea580c;">RUSH</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Glow Accent Line -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <div style="height: 2px; width: 100%; background: linear-gradient(90deg, transparent 0%, #ea580c 50%, transparent 100%); opacity: 0.8;"></div>
            </td>
          </tr>

          <!-- Category Pill & Title -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <div style="display: inline-block; background-color: rgba(234, 88, 12, 0.12); border: 1px solid rgba(234, 88, 12, 0.25); border-radius: 8px; padding: 4px 12px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 700; color: ${primaryColor}; letter-spacing: 1.5px; text-transform: uppercase;">
                  ${data.badge}
                </span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.25;">
                ${data.title}
              </h1>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding-bottom: 24px; text-align: left;">
              <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #e2e8f0;">
                ${data.greeting}
              </p>
              <p style="margin: 0; font-size: 14.5px; color: #94a3b8; line-height: 1.6;">
                ${data.body}
              </p>
            </td>
          </tr>

          <!-- OTP Code Box (if provided) -->
          ${
            data.code
              ? `
          <tr>
            <td style="padding-bottom: 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(180deg, #171924 0%, #10111a 100%); border: 1px dashed rgba(234, 88, 12, 0.45); border-radius: 16px; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.4);">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <span style="font-size: 11px; font-weight: 700; color: #f97316; letter-spacing: 1.8px; text-transform: uppercase; display: block; margin-bottom: 8px;">
                      ${data.codeLabel || 'ONE-TIME CODE'}
                    </span>
                    <div class="code-display" style="font-family: 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 7px; color: #ffffff; text-shadow: 0 0 24px rgba(234, 88, 12, 0.45); margin: 6px 0;">
                      ${data.code}
                    </div>
                    ${
                      data.codeExpiry
                        ? `<span style="font-size: 12px; color: #64748b; font-weight: 500; display: inline-block; margin-top: 6px;">
                            ⏱️ ${data.codeExpiry}
                          </span>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Action Button (if provided) -->
          ${
            data.actionUrl && data.actionText
              ? `
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="border-radius: 14px; background: linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%); box-shadow: 0 8px 25px -4px rgba(234, 88, 12, 0.45);">
                    <a class="cta-button" href="${data.actionUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 14px; letter-spacing: 0.2px;">
                      ${data.actionText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Button not working? Copy and paste this URL into your browser:<br />
                <a href="${data.actionUrl}" target="_blank" style="color: #f97316; word-break: break-all; text-decoration: underline; font-size: 11.5px;">${data.actionUrl}</a>
              </p>
            </td>
          </tr>`
              : ''
          }

          <!-- Security Note / Divider -->
          ${
            data.note
              ? `
          <tr>
            <td style="padding-top: 12px; border-top: 1px solid #1e202f;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                      🔒 <strong style="color: #94a3b8;">Security Reminder:</strong> ${data.note}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 540px; padding-top: 24px; text-align: center;">
          <tr>
            <td align="center">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">
                BiteRush &bull; Fresh Food, Fast Delivery
              </p>
              <p style="margin: 0; font-size: 11.5px; color: #475569;">
                &copy; ${new Date().getFullYear()} BiteRush Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}


