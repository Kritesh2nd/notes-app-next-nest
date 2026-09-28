import { Global, Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { winstonLoggerOptions } from "./winston.config";
import { AppLoggerService } from "./app-logger.service";

@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonLoggerOptions)],
  providers: [AppLoggerService],
  exports: [AppLoggerService, WinstonModule],
})
export class LoggerModule {}
