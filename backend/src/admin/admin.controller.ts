import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { IsBoolean, IsOptional } from "class-validator";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../entities/user.entity";

class SetBannedDto {
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}

@Controller("admin/users")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get()
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch(":id/ban")
  setBanned(@Param("id", ParseUUIDPipe) id: string, @Body() dto: SetBannedDto, @CurrentUser() admin: User) {
    return this.adminService.setBanned(id, admin, dto.isBanned);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() admin: User) {
    return this.adminService.remove(id, admin);
  }
}
