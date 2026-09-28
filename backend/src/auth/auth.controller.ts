import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  DeleteAccountDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../entities/user.entity";
import { AUTH_COOKIE } from "../common/token.util";

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService, private config: ConfigService) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") === "production",
      sameSite: "lax" as const,
      path: "/",
    };
  }

  @Post("register")
  @HttpCode(201)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, { ip: req.ip });
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.authService.login(dto, { ip: req.ip });
    res.cookie(AUTH_COOKIE, token, { ...this.cookieOptions(), maxAge: COOKIE_MAX_AGE });
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie(AUTH_COOKIE, "", { ...this.cookieOptions(), maxAge: 0 });
    return { message: "Signed out." };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.authService.toPublic(user);
  }

  @Post("verify-email")
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post("resend-verification")
  @HttpCode(200)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.deleteAccount(user, dto.password);
    res.cookie(AUTH_COOKIE, "", { ...this.cookieOptions(), maxAge: 0 });
    return result;
  }
}
