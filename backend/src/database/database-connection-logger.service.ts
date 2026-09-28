import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AppLoggerService } from "../logger/app-logger.service";
import { LogEvent } from "../logger/log-event.enum";

@Injectable()
export class DatabaseConnectionLogger implements OnApplicationBootstrap {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext("Database");
  }

  onApplicationBootstrap() {
    // By this lifecycle hook, TypeOrmModule has already awaited dataSource.initialize()
    // as part of provider resolution — if we got here, the connection succeeded.
    if (this.dataSource.isInitialized) {
      const opts = this.dataSource.options as { database?: string; host?: string };
      this.logger.info(LogEvent.DATABASE_CONNECTED, "Database connection established", {
        database: opts.database,
        host: opts.host,
      });
    }
  }
}
