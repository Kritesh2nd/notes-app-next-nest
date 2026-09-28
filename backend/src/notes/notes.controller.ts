import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotesService } from "./notes.service";
import { CreateNoteDto, UpdateNoteDto, ToggleFavoriteDto } from "./dto/notes.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../entities/user.entity";

@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query("q") q?: string, @Query("favorites") favorites?: string) {
    return this.notesService.findAll(user, q, favorites === "true");
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: User) {
    return this.notesService.create(dto, user);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto, @CurrentUser() user: User) {
    return this.notesService.update(id, dto, user);
  }

  @Patch(":id/favorite")
  toggleFavorite(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ToggleFavoriteDto, @CurrentUser() user: User) {
    return this.notesService.toggleFavorite(id, user, dto.isFavorite);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.remove(id, user);
  }
}
