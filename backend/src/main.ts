import { NestFactory } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { winstonLoggerOptions } from "./logger/winston.config";
import { AppLoggerService } from "./logger/app-logger.service";
import { LogEvent } from "./logger/log-event.enum";

async function bootstrap() {
  // Installed before NestFactory.create so Nest's own bootstrap/module-init
  // logs (and any error thrown during that phase, e.g. a bad DB connection)
  // go through Winston -> console + logs/combined.log + logs/error.log too.
  const winstonLogger = WinstonModule.createLogger(winstonLoggerOptions);

  let app;
  try {
    app = await NestFactory.create(AppModule, { logger: winstonLogger });
  } catch (err) {
    // Startup failures are almost always the database refusing the connection.
    const message = err instanceof Error ? err.message : String(err);
    const isDbError = /ECONNREFUSED|database|connect|timeout/i.test(message);
    winstonLogger.error(message, {
      event: isDbError ? LogEvent.DATABASE_FAILURE : LogEvent.UNEXPECTED_EXCEPTION,
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  }

  await configureApp(app);

  // Surface anything that slips past Nest's own error handling (e.g. inside
  // timers, event listeners) instead of silently crashing the process.
  process.on("unhandledRejection", (reason) => {
    winstonLogger.error(reason instanceof Error ? reason.message : String(reason), {
      event: LogEvent.UNEXPECTED_EXCEPTION,
      stack: reason instanceof Error ? reason.stack : undefined,
      source: "unhandledRejection",
    });
  });
  process.on("uncaughtException", (err) => {
    winstonLogger.error(err.message, {
      event: LogEvent.UNEXPECTED_EXCEPTION,
      stack: err.stack,
      source: "uncaughtException",
    });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const bootLogger = await app.resolve(AppLoggerService);
  bootLogger.setContext("Bootstrap");
  bootLogger.info(LogEvent.APP_STARTED, `Blueprint Notes API listening on port ${port}`, { port });
}

bootstrap();
