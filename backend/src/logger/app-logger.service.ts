import { Inject, Injectable, Scope } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger as WinstonLogger } from "winston";
import { LogEvent } from "./log-event.enum";

type Meta = Record<string, unknown>;

/**
 * Application-level structured logger. Wraps Winston so every log line
 * carries a canonical `event` name (see LogEvent) plus arbitrary metadata,
 * on top of whatever Nest's own framework logging already does (which is
 * configured separately in main.ts via WinstonModule.createLogger()).
 *
 * Usage: inject, then call `.setContext("AuthService")` once (transient
 * scope means each injection site gets its own instance/context), then
 * call `.info(LogEvent.LOGIN_SUCCESSFUL, "user@x.com signed in", { userId })`.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService {
  private context?: string;

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly winston: WinstonLogger) {}

  setContext(context: string) {
    this.context = context;
    return this;
  }

  info(event: LogEvent, message: string, meta: Meta = {}) {
    this.winston.info(message, { event, context: this.context, ...meta });
  }

  warn(event: LogEvent, message: string, meta: Meta = {}) {
    this.winston.warn(message, { event, context: this.context, ...meta });
  }

  error(event: LogEvent, message: string, meta: Meta = {}) {
    this.winston.error(message, { event, context: this.context, ...meta });
  }
}
