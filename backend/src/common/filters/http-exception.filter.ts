import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { AppLoggerService } from "../../logger/app-logger.service";
import { LogEvent } from "../../logger/log-event.enum";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext("ExceptionFilter");
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong. Please try again.";
    let details: unknown;
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body !== null) {
        const { message: m, error: e, statusCode: _s, code: c, ...extra } = body as Record<string, unknown> & {
          message?: string | string[];
          error?: string;
          code?: string;
        };
        message = Array.isArray(m) ? m[0] : m || e || message;
        code = c;
        // Validation errors -> { fields }, other custom props (e.g. { unverified: true }) pass through.
        details = Array.isArray(m) ? { fields: m } : Object.keys(extra).length ? extra : undefined;
      }

      // 401/403 thrown deliberately by guards are logged at the guard itself
      // (with fuller context); anything else 5xx here is a real incident.
      if (status >= 500) {
        this.logger.error(LogEvent.UNEXPECTED_EXCEPTION, message, {
          path: request.originalUrl,
          method: request.method,
          status,
        });
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "A database error occurred. Please try again.";
      this.logger.error(LogEvent.DATABASE_FAILURE, exception.message, {
        path: request.originalUrl,
        method: request.method,
        query: exception.query,
      });
    } else {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(LogEvent.UNEXPECTED_EXCEPTION, err.message, {
        path: request.originalUrl,
        method: request.method,
        stack: err.stack,
      });
    }

    response.status(status).json({
      success: false,
      error: message,
      code,
      details,
    });
  }
}
