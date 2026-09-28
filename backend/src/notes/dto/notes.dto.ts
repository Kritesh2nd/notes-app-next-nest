import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @MinLength(1, { message: "Title is required" })
  @MaxLength(120, { message: "Title is too long" })
  title: string;

  @IsString()
  @MinLength(1, { message: "Note content cannot be empty" })
  @MaxLength(50000, { message: "Content is too long" })
  content: string;
}

export class UpdateNoteDto extends CreateNoteDto {}

export class ToggleFavoriteDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
