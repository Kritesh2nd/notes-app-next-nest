import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { User, Role } from "../entities/user.entity";
import { MailerService } from "../mailer/mailer.service";
import { randomToken } from "../common/token.util";
import { AppLoggerService } from "../logger/app-logger.service";
import { LogEvent } from "../logger/log-event.enum";
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "./dto/auth.dto";

export interface RequestMeta {
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwt: JwtService,
    private config: ConfigService,
    private mailer: MailerService,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext("AuthService");
  }

  private async hash(password: string) {
    return bcrypt.hash(password, 10);
  }

  signToken(user: User) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  toPublic(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    const email = dto.email.toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException("An account with this email already exists.");

    const emailVerifyToken = randomToken();
    const user = this.usersRepo.create({
      name: dto.name,
      email,
      password: await this.hash(dto.password),
      role: Role.USER,
      emailVerifyToken,
      emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    await this.usersRepo.save(user);
    await this.mailer.sendVerificationEmail(user.email, emailVerifyToken);

    this.logger.info(LogEvent.USER_REGISTERED, `New account registered: ${email}`, {
      userId: user.id,
      email,
      ip: meta.ip,
    });

    return { message: "Account created. Check your email to verify your address before signing in." };
  }

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(LogEvent.LOGIN_FAILED, `Login attempt for unknown email: ${email}`, {
        email,
        ip: meta.ip,
        reason: "no_such_account",
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (user.isBanned) {
      this.logger.warn(LogEvent.LOGIN_FAILED, `Banned account attempted login: ${email}`, {
        userId: user.id,
        email,
        ip: meta.ip,
        reason: "banned",
      });
      throw new ForbiddenException("This account has been suspended. Contact support.");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(LogEvent.LOGIN_FAILED, `Incorrect password for: ${email}`, {
        userId: user.id,
        email,
        ip: meta.ip,
        reason: "bad_password",
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isEmailVerified) {
      this.logger.warn(LogEvent.LOGIN_FAILED, `Unverified account attempted login: ${email}`, {
        userId: user.id,
        email,
        ip: meta.ip,
        reason: "unverified",
      });
      throw new ForbiddenException({
        message: "Please verify your email address before signing in.",
        unverified: true,
      });
    }

    const token = this.signToken(user);

    this.logger.info(LogEvent.LOGIN_SUCCESSFUL, `Login successful: ${email}`, {
      userId: user.id,
      email,
      ip: meta.ip,
    });

    return { token, user: this.toPublic(user) };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepo.findOne({ where: { emailVerifyToken: token } });
    if (!user) throw new BadRequestException("This verification link is invalid or has already been used.");
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      throw new BadRequestException("This verification link has expired. Please request a new one.");
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await this.usersRepo.save(user);

    return { message: "Email verified. You can now sign in." };
  }

  async resendVerification(email: string) {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (user && !user.isEmailVerified) {
      const token = randomToken();
      user.emailVerifyToken = token;
      user.emailVerifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await this.usersRepo.save(user);
      await this.mailer.sendVerificationEmail(user.email, token);
    }
    // Generic response to avoid leaking which emails are registered.
    return { message: "If that account needs verification, a new email has been sent." };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (user && !user.isBanned) {
      const token = randomToken();
      user.resetPasswordToken = token;
      user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
      await this.usersRepo.save(user);
      await this.mailer.sendPasswordResetEmail(user.email, token);
    }
    return { message: "If an account exists for that email, reset instructions have been sent." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { resetPasswordToken: dto.token, resetPasswordExpires: MoreThan(new Date()) },
    });
    if (!user) throw new BadRequestException("This reset link is invalid or has expired.");

    user.password = await this.hash(dto.password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.usersRepo.save(user);

    return { message: "Password updated. You can now sign in." };
  }

  async deleteAccount(user: User, password: string) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Incorrect password.");
    await this.usersRepo.remove(user);
    return { message: "Account deleted." };
  }
}
