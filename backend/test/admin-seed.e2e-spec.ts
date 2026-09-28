import request from "supertest";
import * as bcrypt from "bcryptjs";
import { createTestApp, TestContext } from "./helpers/create-test-app";
import { AdminSeedService } from "../src/bootstrap/admin-seed.service";
import { User, Role } from "../src/entities/user.entity";
import { ADMIN } from "./helpers/test-utils";

describe("Admin bootstrap from env (AdminSeedService)", () => {
  let ctx: TestContext;
  const users = () => ctx.dataSource.getRepository(User);
  const rerun = () => ctx.app.get(AdminSeedService).onApplicationBootstrap();

  beforeAll(async () => (ctx = await createTestApp()));
  afterAll(() => ctx.close());

  it("creates a verified ADMIN from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME on startup", async () => {
    const admin = await users().findOneByOrFail({ email: ADMIN.email });
    expect(admin).toMatchObject({ role: Role.ADMIN, isEmailVerified: true, isBanned: false, name: "Test Admin" });
    expect(await bcrypt.compare(ADMIN.password, admin.password)).toBe(true);
  });

  it("is idempotent — restarting doesn't create duplicates", async () => {
    await rerun();
    await rerun();
    expect(await users().countBy({ email: ADMIN.email })).toBe(1);
  });

  it("repairs a demoted / unverified / banned admin on restart", async () => {
    await users().update({ email: ADMIN.email }, { role: Role.USER, isEmailVerified: false, isBanned: true });
    await rerun();
    const admin = await users().findOneByOrFail({ email: ADMIN.email });
    expect(admin).toMatchObject({ role: Role.ADMIN, isEmailVerified: true, isBanned: false });
  });

  it("does not overwrite a password the admin changed (unless ADMIN_FORCE_RESET=true)", async () => {
    const changed = await bcrypt.hash("ChangedPass1", 10);
    await users().update({ email: ADMIN.email }, { password: changed });
    await rerun();
    expect((await users().findOneByOrFail({ email: ADMIN.email })).password).toBe(changed);

    process.env.ADMIN_FORCE_RESET = "true";
    try {
      await rerun();
    } finally {
      delete process.env.ADMIN_FORCE_RESET;
    }
    const after = await users().findOneByOrFail({ email: ADMIN.email });
    expect(await bcrypt.compare(ADMIN.password, after.password)).toBe(true);
    await request(ctx.app.getHttpServer()).post("/api/auth/login").send(ADMIN).expect(200);
  });
});
