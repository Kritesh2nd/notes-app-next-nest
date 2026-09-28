import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, Role } from "../entities/user.entity";
import { AppLoggerService } from "../logger/app-logger.service";
import { LogEvent } from "../logger/log-event.enum";

/**
 * Ensures exactly one admin account exists, sourced entirely from backend
 * environment variables (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME).
 *
 * Runs on every application start:
 *  - If no user with ADMIN_EMAIL exists, creates one as ADMIN, pre-verified.
 *  - If a user with ADMIN_EMAIL exists but isn't ADMIN, promotes it.
 *  - Never overwrites an existing admin's password (so changing it in the
 *    app afterwards isn't clobbered on next restart). Set ADMIN_FORCE_RESET=true
 *    to force the password back to ADMIN_PASSWORD on every boot.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private config: ConfigService,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext("AdminSeed");
  }

  async onApplicationBootstrap() {
    const email = this.config.get<string>("ADMIN_EMAIL")?.toLowerCase().trim();
    const password = this.config.get<string>("ADMIN_PASSWORD");
    const name = this.config.get<string>("ADMIN_NAME", "Site Admin");
    const forceReset = this.config.get<string>("ADMIN_FORCE_RESET") === "true";

    if (!email || !password) {
      // Not one of the required audit events — a plain operational note, not a system warning.
      // eslint-disable-next-line no-console
      console.warn(
        "[AdminSeed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap. Set both in the backend .env to auto-provision an admin account."
      );
      return;
    }

    let admin = await this.usersRepo.findOne({ where: { email } });

    if (!admin) {
      admin = this.usersRepo.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: Role.ADMIN,
        isEmailVerified: true,
      });
      await this.usersRepo.save(admin);
      this.logger.info(LogEvent.ADMIN_ACTION, `Admin account created from env: ${email}`, {
        userId: admin.id,
        email,
        source: "bootstrap",
      });
      return;
    }

    let changed = false;

    if (admin.role !== Role.ADMIN) {
      admin.role = Role.ADMIN;
      changed = true;
    }
    if (!admin.isEmailVerified) {
      admin.isEmailVerified = true;
      changed = true;
    }
    if (admin.isBanned) {
      admin.isBanned = false;
      changed = true;
    }
    if (forceReset) {
      admin.password = await bcrypt.hash(password, 10);
      changed = true;
    }

    if (changed) {
      await this.usersRepo.save(admin);
      this.logger.info(LogEvent.ADMIN_ACTION, `Admin account synced from env: ${email}`, {
        userId: admin.id,
        email,
        source: "bootstrap",
      });
    } else {
      this.logger.info(LogEvent.ADMIN_ACTION, `Admin account already up to date: ${email}`, {
        userId: admin.id,
        email,
        source: "bootstrap",
      });
    }
  }
}
