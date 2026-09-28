import request from "supertest";
import { createTestApp, TestContext } from "./helpers/create-test-app";
import { ADMIN, adminAgent, createLoggedInUser, createNote, createUser } from "./helpers/test-utils";
import { User } from "../src/entities/user.entity";
import { Note } from "../src/entities/note.entity";

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

describe("Admin endpoints", () => {
  let ctx: TestContext;
  const server = () => request(ctx.app.getHttpServer());
  const users = () => ctx.dataSource.getRepository(User);

  beforeAll(async () => (ctx = await createTestApp()));
  afterAll(() => ctx.close());
  beforeEach(() => jest.clearAllMocks());

  describe("access control", () => {
    it.each([
      ["get", "/api/admin/users"],
      ["patch", `/api/admin/users/${MISSING_ID}/ban`],
      ["delete", `/api/admin/users/${MISSING_ID}`],
    ] as const)("%s %s → 401 when signed out", async (method, url) => {
      const res = await server()[method](url).send({}).expect(401);
      expect(res.body.code).toBe("SESSION_INVALID");
    });

    it.each([
      ["get", "/api/admin/users"],
      ["patch", `/api/admin/users/${MISSING_ID}/ban`],
      ["delete", `/api/admin/users/${MISSING_ID}`],
    ] as const)("%s %s → 403 for a non-admin, and logs 'Unauthorized access'", async (method, url) => {
      const { agent } = await createLoggedInUser(ctx);
      const res = await agent[method](url).send({}).expect(403);
      expect(res.body).toMatchObject({ success: false, error: "Admins only." });
      expect(res.body.code).toBeUndefined(); // stays signed in — just not allowed
      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Unauthorized access" }));
    });
  });

  describe("GET /api/admin/users", () => {
    it("lists every user with note counts and no secrets", async () => {
      const admin = await adminAgent(ctx);
      const { agent, user } = await createLoggedInUser(ctx);
      await createNote(agent, "a");
      await createNote(agent, "b");
      const { user: empty } = await createUser(ctx);

      const res = await admin.get("/api/admin/users").expect(200);
      const byId = new Map<string, { _count: { notes: number }; email: string; role: string }>(
        res.body.data.map((u: { id: string }) => [u.id, u])
      );
      expect(byId.get(user.id)!._count.notes).toBe(2);
      expect(byId.get(empty.id)!._count.notes).toBe(0);
      expect([...byId.values()].some((u) => u.email === ADMIN.email && u.role === "ADMIN")).toBe(true);

      const raw = JSON.stringify(res.body);
      expect(raw).not.toMatch(/"password"|emailVerifyToken|resetPasswordToken/);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({ id: expect.any(String), name: expect.any(String), isBanned: expect.any(Boolean), isEmailVerified: expect.any(Boolean), createdAt: expect.anything() })
      );
    });

    it("orders newest users first", async () => {
      const admin = await adminAgent(ctx);
      await createUser(ctx);
      const res = await admin.get("/api/admin/users").expect(200);
      const dates = res.body.data.map((u: { createdAt: string }) => new Date(u.createdAt).getTime());
      expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    });
  });

  describe("PATCH /api/admin/users/:id/ban", () => {
    it("bans with an explicit flag, blocks login, kills the live session, and logs an 'Admin action'", async () => {
      const admin = await adminAgent(ctx);
      const { agent, user, email, password } = await createLoggedInUser(ctx);

      const res = await admin.patch(`/api/admin/users/${user.id}/ban`).send({ isBanned: true }).expect(200);
      expect(res.body.data).toMatchObject({ id: user.id, isBanned: true });
      expect(ctx.logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "Admin action", action: "ban", targetUserId: user.id })
      );

      // existing session is rejected with the auto-logout code…
      const me = await agent.get("/api/auth/me").expect(401);
      expect(me.body.code).toBe("SESSION_USER_BANNED");
      // …and they can't sign in again
      await server().post("/api/auth/login").send({ email, password }).expect(403);
    });

    it("unbans and restores access", async () => {
      const admin = await adminAgent(ctx);
      const { user, email, password } = await createLoggedInUser(ctx);
      await admin.patch(`/api/admin/users/${user.id}/ban`).send({ isBanned: true }).expect(200);
      const res = await admin.patch(`/api/admin/users/${user.id}/ban`).send({ isBanned: false }).expect(200);
      expect(res.body.data.isBanned).toBe(false);
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: "unban" }));
      await server().post("/api/auth/login").send({ email, password }).expect(200);
    });

    it("toggles when no flag is supplied", async () => {
      const admin = await adminAgent(ctx);
      const { user } = await createUser(ctx);
      const a = await admin.patch(`/api/admin/users/${user.id}/ban`).send({}).expect(200);
      expect(a.body.data.isBanned).toBe(true);
      const b = await admin.patch(`/api/admin/users/${user.id}/ban`).send({}).expect(200);
      expect(b.body.data.isBanned).toBe(false);
    });

    it("refuses to ban the admin themselves or another admin", async () => {
      const admin = await adminAgent(ctx);
      const me = await users().findOneByOrFail({ email: ADMIN.email });
      const self = await admin.patch(`/api/admin/users/${me.id}/ban`).send({ isBanned: true }).expect(400);
      expect(self.body.error).toMatch(/own admin account/i);

      const { user } = await createUser(ctx);
      await users().update(user.id, { role: "ADMIN" as never });
      const other = await admin.patch(`/api/admin/users/${user.id}/ban`).send({ isBanned: true }).expect(400);
      expect(other.body.error).toMatch(/admins cannot be banned/i);
      expect((await users().findOneByOrFail({ id: user.id })).isBanned).toBe(false);
    });

    it("returns 404 for an unknown user, 400 for a malformed id, 422 for a non-boolean flag", async () => {
      const admin = await adminAgent(ctx);
      await admin.patch(`/api/admin/users/${MISSING_ID}/ban`).send({ isBanned: true }).expect(404);
      await admin.patch("/api/admin/users/nope/ban").send({ isBanned: true }).expect(400);
      const { user } = await createUser(ctx);
      await admin.patch(`/api/admin/users/${user.id}/ban`).send({ isBanned: "yes" }).expect(422);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("deletes the user and their notes, logs an 'Admin action', and auto-logs-out their live session", async () => {
      const admin = await adminAgent(ctx);
      const { agent, user } = await createLoggedInUser(ctx);
      await createNote(agent, "n1");
      await createNote(agent, "n2");

      const res = await admin.delete(`/api/admin/users/${user.id}`).expect(200);
      expect(res.body.data.message).toMatch(/deleted/i);
      expect(ctx.logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "Admin action", action: "delete_user", targetUserId: user.id })
      );

      expect(await users().findOneBy({ id: user.id })).toBeNull();
      expect(await ctx.dataSource.getRepository(Note).countBy({ authorId: user.id })).toBe(0);
      const me = await agent.get("/api/auth/me").expect(401);
      expect(me.body.code).toBe("SESSION_USER_DELETED");
    });

    it("refuses to delete the calling admin", async () => {
      const admin = await adminAgent(ctx);
      const me = await users().findOneByOrFail({ email: ADMIN.email });
      const res = await admin.delete(`/api/admin/users/${me.id}`).expect(400);
      expect(res.body.error).toMatch(/own admin account/i);
      expect(await users().findOneBy({ id: me.id })).not.toBeNull();
    });

    it("returns 404 for an unknown or already-deleted user, and 400 for a malformed id", async () => {
      const admin = await adminAgent(ctx);
      const { user } = await createUser(ctx);
      await admin.delete(`/api/admin/users/${user.id}`).expect(200);
      await admin.delete(`/api/admin/users/${user.id}`).expect(404);
      await admin.delete(`/api/admin/users/${MISSING_ID}`).expect(404);
      await admin.delete("/api/admin/users/nope").expect(400);
    });
  });
});
