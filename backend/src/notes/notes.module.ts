import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Note } from "../entities/note.entity";
import { User } from "../entities/user.entity";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Note, User]), AuthModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
