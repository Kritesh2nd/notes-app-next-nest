import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Note } from "./entities/note.entity";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { NotesModule } from "./notes/notes.module";
import { AdminModule } from "./admin/admin.module";
import { MailerModule } from "./mailer/mailer.module";
import { LoggerModule } from "./logger/logger.module";
import { AdminSeedService } from "./bootstrap/admin-seed.service";
import { DatabaseConnectionLogger } from "./database/database-connection-logger.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("DATABASE_URL"),
        entities: [User, Note],
        // Dev convenience: auto-sync schema. Disable and use migrations in production
        // by setting TYPEORM_SYNC=false and running `npm run migration:run`.
        synchronize: config.get<string>("TYPEORM_SYNC", "true") === "true",
        logging: config.get<string>("NODE_ENV") === "development" ? ["error", "warn"] : ["error"],
      }),
    }),
    TypeOrmModule.forFeature([User, Note]),
    MailerModule,
    AuthModule,
    NotesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AdminSeedService, DatabaseConnectionLogger],
})
export class AppModule {}
