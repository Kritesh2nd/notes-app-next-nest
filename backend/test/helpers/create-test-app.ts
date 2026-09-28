import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { DataType, newDb } from "pg-mem";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { randomUUID } from "crypto";
import { User } from "../../src/entities/user.entity";
import { Note } from "../../src/entities/note.entity";
import { AuthModule } from "../../src/auth/auth.module";
import { NotesModule } from "../../src/notes/notes.module";
import { AdminModule } from "../../src/admin/admin.module";
import { LoggerModule } from "../../src/logger/logger.module";
import { AppController } from "../../src/app.controller";
import { AdminSeedService } from "../../src/bootstrap/admin-seed.service";
import { MailerService } from "../../src/mailer/mailer.service";
import { configureApp } from "../../src/app.setup";

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  mailer: { sendVerificationEmail: jest.Mock; sendPasswordResetEmail: jest.Mock };
  /** Fake Winston logger: assert on log events without writing files. */
  logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock; log: jest.Mock; debug: jest.Mock; verbose: jest.Mock };
  close: () => Promise<void>;
}

/** Boots the real app modules against an in-memory Postgres (pg-mem). */
export async function createTestApp(): Promise<TestContext> {
  const mailer = { sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  let dataSource!: DataSource;

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      LoggerModule,
      TypeOrmModule.forRootAsync({
        useFactory: () => ({ type: "postgres" as const }),
        dataSourceFactory: async () => {
          const db = newDb({ autoCreateForeignKeyIndices: true });
          db.public.registerFunction({ name: "current_database", returns: DataType.text, implementation: () => "test" });
          db.public.registerFunction({ name: "version", returns: DataType.text, implementation: () => "PostgreSQL 16" });
          db.registerExtension("uuid-ossp", (schema) => {
            schema.registerFunction({
              name: "uuid_generate_v4",
              returns: DataType.uuid,
              implementation: randomUUID,
              impure: true,
            });
          });
          dataSource = await db.adapters
            .createTypeormDataSource({ type: "postgres", entities: [User, Note], synchronize: true })
            .initialize();
          return dataSource;
        },
      }),
      TypeOrmModule.forFeature([User, Note]),
      AuthModule,
      NotesModule,
      AdminModule,
    ],
    controllers: [AppController],
    providers: [AdminSeedService],
  })
    .overrideProvider(MailerService)
    .useValue(mailer)
    .overrideProvider(WINSTON_MODULE_PROVIDER)
    .useValue(logger)
    .compile();

  const app = moduleRef.createNestApplication();
  await configureApp(app);
  await app.init(); // also runs AdminSeedService.onApplicationBootstrap

  return { app, dataSource, mailer, logger, close: () => app.close() };
}
