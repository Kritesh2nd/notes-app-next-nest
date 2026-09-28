import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";

@Injectable()
export class MailerService {
  private readonly logger = new Logger("MailerService");
  private transport: Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    if (host) {
      this.transport = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>("SMTP_PORT", "587")),
        secure: Number(this.config.get<string>("SMTP_PORT")) === 465,
        auth: this.config.get<string>("SMTP_USER")
          ? {
              user: this.config.get<string>("SMTP_USER"),
              pass: this.config.get<string>("SMTP_PASSWORD"),
            }
          : undefined,
      });
    }
  }

  private appName() {
    return this.config.get<string>("APP_NAME", "Blueprint Notes");
  }

  private appUrl() {
    return this.config.get<string>("APP_URL", "http://localhost:3000");
  }

  private wrap(title: string, body: string, ctaText: string, ctaUrl: string) {
    return `
<div style="font-family:'Courier New',monospace;background:#0a1128;color:#e8ecf1;padding:32px;">
  <div style="max-width:520px;margin:0 auto;border:1px solid #d99b2b;padding:24px;">
    <h2 style="color:#d99b2b;letter-spacing:2px;text-transform:uppercase;font-size:16px;">${this.appName()}</h2>
    <h1 style="font-size:20px;margin-top:0;">${title}</h1>
    <p style="line-height:1.6;color:#b9c2d0;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;margin-top:16px;background:#d99b2b;color:#0a1128;padding:10px 20px;text-decoration:none;font-weight:bold;">${ctaText}</a>
    <p style="margin-top:24px;font-size:12px;color:#5c6b85;">If the button doesn't work, copy this link:<br/>${ctaUrl}</p>
  </div>
</div>`;
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transport) {
      this.logger.log(`\n----- [DEV EMAIL] -----\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, " ")}\n------------------------`);
      return;
    }
    await this.transport.sendMail({
      from: this.config.get<string>("SMTP_FROM", `${this.appName()} <no-reply@blueprint-notes.dev>`),
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.appUrl()}/verify-email?token=${token}`;
    await this.send(
      to,
      `Verify your ${this.appName()} account`,
      this.wrap(
        "Confirm your email address",
        "Welcome aboard. Please confirm this is your email address to activate your account and start drafting notes.",
        "Verify Email",
        url
      )
    );
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.appUrl()}/reset-password?token=${token}`;
    await this.send(
      to,
      `Reset your ${this.appName()} password`,
      this.wrap(
        "Reset your password",
        "We received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
        "Reset Password",
        url
      )
    );
  }
}
