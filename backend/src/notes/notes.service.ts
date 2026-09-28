import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Note } from "../entities/note.entity";
import { User } from "../entities/user.entity";
import { AppLoggerService } from "../logger/app-logger.service";
import { LogEvent } from "../logger/log-event.enum";
import { CreateNoteDto, UpdateNoteDto } from "./dto/notes.dto";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private notesRepo: Repository<Note>,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext("NotesService");
  }

  async findAll(user: User, q?: string, favoritesOnly?: boolean) {
    const baseWhere = {
      authorId: user.id,
      ...(favoritesOnly ? { isFavorite: true } : {}),
    };

    if (q) {
      return this.notesRepo.find({
        where: [
          { ...baseWhere, title: ILike(`%${q}%`) },
          { ...baseWhere, content: ILike(`%${q}%`) },
        ],
        order: { isFavorite: "DESC", updatedAt: "DESC" },
      });
    }

    return this.notesRepo.find({
      where: baseWhere,
      order: { isFavorite: "DESC", updatedAt: "DESC" },
    });
  }

  private async findOwned(id: string, user: User) {
    const note = await this.notesRepo.findOne({ where: { id } });
    if (!note || note.authorId !== user.id) throw new NotFoundException("Note not found.");
    return note;
  }

  async findOne(id: string, user: User) {
    const note = await this.findOwned(id, user);
    this.logger.info(LogEvent.NOTE_READ, `Note read: ${id}`, { noteId: id, userId: user.id });
    return note;
  }

  async create(dto: CreateNoteDto, user: User) {
    const note = this.notesRepo.create({ ...dto, authorId: user.id });
    const saved = await this.notesRepo.save(note);
    this.logger.info(LogEvent.NOTE_CREATED, `Note created: ${saved.id}`, {
      noteId: saved.id,
      userId: user.id,
      title: saved.title,
    });
    return saved;
  }

  async update(id: string, dto: UpdateNoteDto, user: User) {
    const note = await this.findOwned(id, user);
    Object.assign(note, dto);
    const saved = await this.notesRepo.save(note);
    this.logger.info(LogEvent.NOTE_UPDATED, `Note updated: ${id}`, { noteId: id, userId: user.id });
    return saved;
  }

  async toggleFavorite(id: string, user: User, isFavorite?: boolean) {
    const note = await this.findOwned(id, user);
    note.isFavorite = typeof isFavorite === "boolean" ? isFavorite : !note.isFavorite;
    const saved = await this.notesRepo.save(note);
    this.logger.info(LogEvent.NOTE_UPDATED, `Note favorite toggled: ${id}`, {
      noteId: id,
      userId: user.id,
      isFavorite: saved.isFavorite,
    });
    return saved;
  }

  async remove(id: string, user: User) {
    const note = await this.findOwned(id, user);
    await this.notesRepo.remove(note);
    this.logger.info(LogEvent.NOTE_DELETED, `Note deleted: ${id}`, { noteId: id, userId: user.id });
    return { message: "Note deleted." };
  }
}
