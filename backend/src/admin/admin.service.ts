import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Note } from "../entities/note.entity";
import { User, Role } from "../entities/user.entity";
import { AppLoggerService } from "../logger/app-logger.service";
import { LogEvent } from "../logger/log-event.enum";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Note) private notesRepo: Repository<Note>,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext("AdminService");
  }

  async listUsers() {
    const users = await this.usersRepo.find({ order: { createdAt: "DESC" } });
    const counts = await this.notesRepo
      .createQueryBuilder("note")
      .select("note.authorId", "authorId")
      .addSelect("COUNT(*)", "count")
      .groupBy("note.authorId")
      .getRawMany<{ authorId: string; count: string }>();

    const countMap = new Map(counts.map((c) => [c.authorId, Number(c.count)]));

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isBanned: u.isBanned,
      isEmailVerified: u.isEmailVerified,
      createdAt: u.createdAt,
      _count: { notes: countMap.get(u.id) || 0 },
    }));
  }

  async setBanned(id: string, admin: User, isBanned?: boolean) {
    if (id === admin.id) throw new BadRequestException("You cannot ban your own admin account.");

    const target = await this.usersRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException("User not found.");
    if (target.role === Role.ADMIN) throw new BadRequestException("Admins cannot be banned.");

    target.isBanned = typeof isBanned === "boolean" ? isBanned : !target.isBanned;
    await this.usersRepo.save(target);

    this.logger.info(
      LogEvent.ADMIN_ACTION,
      `Admin ${admin.email} ${target.isBanned ? "banned" : "unbanned"} user ${target.email}`,
      { adminId: admin.id, targetUserId: target.id, action: target.isBanned ? "ban" : "unban" }
    );

    return { id: target.id, name: target.name, email: target.email, isBanned: target.isBanned };
  }

  async remove(id: string, admin: User) {
    if (id === admin.id) throw new BadRequestException("You cannot delete your own admin account from here.");

    const target = await this.usersRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException("User not found.");

    await this.usersRepo.remove(target);

    this.logger.info(LogEvent.ADMIN_ACTION, `Admin ${admin.email} deleted user ${target.email}`, {
      adminId: admin.id,
      targetUserId: id,
      targetEmail: target.email,
      action: "delete_user",
    });

    return { message: "User deleted." };
  }
}
