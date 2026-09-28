import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../entities/user.entity";
import { Note } from "../entities/note.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, Note],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: process.env.TYPEORM_SYNC === "true", // dev convenience only; use migrations in prod
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

// Used by the TypeORM CLI (migration:generate / migration:run / migration:revert)
export default new DataSource(dataSourceOptions);
