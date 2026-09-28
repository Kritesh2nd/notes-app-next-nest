import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request, Response } from "express";
import { User } from "../../entities/user.entity";
import { AppLoggerService } from "../../logger/app-logger.service";
import { LogEvent } from "../../logger/log-event.enum";
import { AUTH_COOKIE } from "../token.util";

/**
 * Codes the frontend uses to detect "your session is no longer valid" and
 * auto-logout (see frontend/src/lib/api-client.ts). Anything starting with
 * "SESSION_" ends the session client-side.
 */
export const SESSION_INVALID = "SESSION_INVALID";
export const SESSION_USER_DELETED = "SESSION_USER_DELETED";
export const SESSION_USER_BANNED = "SESSION_USER_BANNED";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private readonly logger: AppLoggerService
  ) {
    super();
    this.logger.setContext("JwtAuthGuard");
  }

  /** Log, drop the stale session cookie, and reject with a machine-readable code. */
  private reject(context: ExecutionContext, message: string, code: string): never {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    this.logger.warn(LogEvent.UNAUTHORIZED_ACCESS, message, {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      code,
    });

    // Clear the dead session so the browser stops sending it (and Next middleware
    // stops treating the visitor as signed in).
    res.clearCookie(AUTH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    throw new UnauthorizedException({ message, code });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let passportOk = false;
    try {
      passportOk = (await super.canActivate(context)) as boolean;
    } catch {
      this.reject(context, "Not authenticated.", SESSION_INVALID);
    }
    if (!passportOk) this.reject(context, "Not authenticated.", SESSION_INVALID);

    const req = context.switchToHttp().getRequest();
    const user = await this.usersRepo.findOne({ where: { id: req.user.userId } });

    if (!user) {
      this.reject(context, "Your account no longer exists.", SESSION_USER_DELETED);
    }
    if (user!.isBanned) {
      this.reject(context, "This account has been suspended.", SESSION_USER_BANNED);
    }

    // Attach the full, fresh user record for downstream handlers
    req.currentUser = user;
    return true;
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException("Not authenticated.");
    }
    return user;
  }
}
