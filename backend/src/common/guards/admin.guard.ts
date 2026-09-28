import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";
import { User, Role } from "../../entities/user.entity";
import { AppLoggerService } from "../../logger/app-logger.service";
import { LogEvent } from "../../logger/log-event.enum";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext("AdminGuard");
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { currentUser: User }>();
    if (!req.currentUser || req.currentUser.role !== Role.ADMIN) {
      this.logger.warn(
        LogEvent.UNAUTHORIZED_ACCESS,
        `Non-admin user attempted an admin-only route: ${req.currentUser?.email || "unknown"}`,
        { path: req.originalUrl, method: req.method, userId: req.currentUser?.id }
      );
      throw new ForbiddenException("Admins only.");
    }
    return true;
  }
}
