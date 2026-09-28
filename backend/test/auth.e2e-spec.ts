import request from "supertest";
import { createTestApp, TestContext } from "./helpers/create-test-app";
import { PASSWORD, createLoggedInUser, createUser, loginAgent, uniqueEmail, ADMIN } from "./helpers/test-utils";
import { User } from "../src/entities/user.entity";
import { Note } from "../src/entities/note.entity";

const cookieHeader = (res: request.Response) => ((res.headers["set-cookie"] as unknown as string[]) || []).join(";");

describe("Auth endpoints", () => {
  let ctx: TestContext;
  const users = () => ctx.dataSource.getRepository(User);

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(() => jest.clearAllMocks());

  const server = () => request(ctx.app.getHttpServer());

  // ---------------------------------------------------------------- register
  describe("POST /api/auth/register", () => {
    it("creates an unverified USER, lowercases the email, hashes the password and sends a verification email", async () => {
      const email = uniqueEmail("MiXeD");
      const res = await server().post("/api/auth/register").send({ name: "Ada", email, password: PASSWORD }).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/verify/i);

      const user = await users().findOneByOrFail({ email: email.toLowerCase() });
      expect(user.role).toBe("USER");
      expect(user.isEmailVerified).toBe(false);
      expect(user.password).not.toBe(PASSWORD);
      expect(user.emailVerifyToken).toBeTruthy();
      expect(ctx.mailer.sendVerificationEmail).toHaveBeenCalledWith(email.toLowerCase(), user.emailVerifyToken);
    });

    it("logs a 'User registered' INFO event", async () => {
      await server().post("/api/auth/register").send({ name: "Log Me", email: uniqueEmail(), password: PASSWORD }).expect(201);
      expect(ctx.logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "User registered" })
      );
    });

    it("never returns the password or tokens", async () => {
      const res = await server().post("/api/auth/register").send({ name: "Ada", email: uniqueEmail(), password: PASSWORD }).expect(201);
      expect(JSON.stringify(res.body)).not.toMatch(/"password"|emailVerifyToken/);
    });

    it("rejects a duplicate email with 409", async () => {
      const { email } = await createUser(ctx);
      const res = await server().post("/api/auth/register").send({ name: "Dup", email, password: PASSWORD }).expect(409);
      expect(res.body).toMatchObject({ success: false, error: expect.stringMatching(/already exists/i) });
    });

    it("treats email case-insensitively for duplicates", async () => {
      const { email } = await createUser(ctx);
      await server().post("/api/auth/register").send({ name: "Dup", email: email.toUpperCase(), password: PASSWORD }).expect(409);
    });

    it.each([
      ["name too short", { name: "A", email: "a@b.dev", password: PASSWORD }, /name/i],
      ["invalid email", { name: "Ada", email: "not-an-email", password: PASSWORD }, /email/i],
      ["password too short", { name: "Ada", email: "a@b.dev", password: "Ab1" }, /8 characters/i],
      ["password without uppercase", { name: "Ada", email: "a@b.dev", password: "password1" }, /uppercase/i],
      ["password without lowercase", { name: "Ada", email: "a@b.dev", password: "PASSWORD1" }, /lowercase/i],
      ["password without number", { name: "Ada", email: "a@b.dev", password: "Passwordd" }, /number/i],
      ["missing body", {}, /./],
    ])("returns 422 for %s", async (_label, body, msg) => {
      const res = await server().post("/api/auth/register").send(body).expect(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(msg);
      expect(ctx.mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------- login
  describe("POST /api/auth/login", () => {
    it("signs a verified user in, returns the public user and sets an httpOnly session cookie", async () => {
      const { email, password } = await createUser(ctx);
      const res = await server().post("/api/auth/login").send({ email, password }).expect(200);

      expect(res.body.data).toMatchObject({ email, role: "USER", isEmailVerified: true });
      expect(res.body.data.password).toBeUndefined();
      const cookie = cookieHeader(res);
      expect(cookie).toContain("bp_session=");
      expect(cookie).toMatch(/HttpOnly/i);
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Login successful" }));
    });

    it("is case-insensitive on email", async () => {
      const { email, password } = await createUser(ctx);
      await server().post("/api/auth/login").send({ email: email.toUpperCase(), password }).expect(200);
    });

    it("rejects a wrong password with 401 and logs a WARN 'Login failed'", async () => {
      const { email } = await createUser(ctx);
      const res = await server().post("/api/auth/login").send({ email, password: "WrongPass1" }).expect(401);
      expect(res.body).toMatchObject({ success: false, error: "Invalid email or password." });
      expect(res.body.code).toBeUndefined(); // must NOT trigger the frontend auto-logout
      expect(cookieHeader(res)).not.toContain("bp_session=ey");
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "Login failed", reason: "bad_password" })
      );
    });

    it("rejects an unknown email with the same generic 401 (no account enumeration)", async () => {
      const res = await server().post("/api/auth/login").send({ email: uniqueEmail("ghost"), password: PASSWORD }).expect(401);
      expect(res.body.error).toBe("Invalid email or password.");
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "Login failed", reason: "no_such_account" })
      );
    });

    it("rejects an unverified account with 403 and details.unverified=true", async () => {
      const { email, password } = await createUser(ctx, { verified: false });
      const res = await server().post("/api/auth/login").send({ email, password }).expect(403);
      expect(res.body.error).toMatch(/verify your email/i);
      expect(res.body.details).toMatchObject({ unverified: true });
    });

    it("rejects a banned account with 403", async () => {
      const { email, password, user } = await createUser(ctx);
      await users().update(user.id, { isBanned: true });
      const res = await server().post("/api/auth/login").send({ email, password }).expect(403);
      expect(res.body.error).toMatch(/suspended/i);
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: "Login failed", reason: "banned" })
      );
    });

    it.each([
      ["invalid email", { email: "nope", password: PASSWORD }],
      ["empty password", { email: "a@b.dev", password: "" }],
      ["missing fields", {}],
    ])("returns 422 for %s", async (_l, body) => {
      const res = await server().post("/api/auth/login").send(body).expect(422);
      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------ logout
  describe("POST /api/auth/logout", () => {
    it("clears the session cookie", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const res = await agent.post("/api/auth/logout").expect(200);
      expect(res.body.data.message).toMatch(/signed out/i);
      expect(cookieHeader(res)).toMatch(/bp_session=;/);
      await agent.get("/api/auth/me").expect(401);
    });

    it("succeeds even when not signed in", async () => {
      await server().post("/api/auth/logout").expect(200);
    });
  });

  // ---------------------------------------------------------------------- me
  describe("GET /api/auth/me", () => {
    it("returns the current user", async () => {
      const { agent, email } = await createLoggedInUser(ctx);
      const res = await agent.get("/api/auth/me").expect(200);
      expect(res.body.data).toMatchObject({ email, role: "USER" });
      expect(res.body.data.password).toBeUndefined();
    });

    it("returns 401 SESSION_INVALID without a cookie", async () => {
      const res = await server().get("/api/auth/me").expect(401);
      expect(res.body).toMatchObject({ success: false, code: "SESSION_INVALID" });
      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Unauthorized access" }));
    });

    it("returns 401 SESSION_INVALID for a tampered token", async () => {
      const res = await server().get("/api/auth/me").set("Cookie", "bp_session=not.a.jwt").expect(401);
      expect(res.body.code).toBe("SESSION_INVALID");
    });

    it("accepts the token as a Bearer header too", async () => {
      const { email, password } = await createUser(ctx);
      const login = await server().post("/api/auth/login").send({ email, password }).expect(200);
      const token = /bp_session=([^;]+)/.exec(cookieHeader(login))![1];
      await server().get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
    });

    it("auto-logout: returns 401 SESSION_USER_DELETED and clears the cookie once the user is deleted", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      await users().delete(user.id);
      const res = await agent.get("/api/auth/me").expect(401);
      expect(res.body.code).toBe("SESSION_USER_DELETED");
      expect(cookieHeader(res)).toMatch(/bp_session=;/);
    });

    it("auto-logout: returns 401 SESSION_USER_BANNED once the user is banned", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      await users().update(user.id, { isBanned: true });
      const res = await agent.get("/api/auth/me").expect(401);
      expect(res.body.code).toBe("SESSION_USER_BANNED");
    });
  });

  // ------------------------------------------------------------ verify-email
  describe("POST /api/auth/verify-email", () => {
    it("verifies the account, consumes the token, and allows login afterwards", async () => {
      const { email, password, user } = await createUser(ctx, { verified: false });
      await server().post("/api/auth/verify-email").send({ token: user.emailVerifyToken }).expect(200);

      const after = await users().findOneByOrFail({ id: user.id });
      expect(after.isEmailVerified).toBe(true);
      expect(after.emailVerifyToken).toBeNull();
      await server().post("/api/auth/login").send({ email, password }).expect(200);
    });

    it("rejects re-using the token", async () => {
      const { user } = await createUser(ctx, { verified: false });
      await server().post("/api/auth/verify-email").send({ token: user.emailVerifyToken }).expect(200);
      const res = await server().post("/api/auth/verify-email").send({ token: user.emailVerifyToken }).expect(400);
      expect(res.body.error).toMatch(/invalid|already used/i);
    });

    it("rejects an unknown token with 400", async () => {
      await server().post("/api/auth/verify-email").send({ token: "nope" }).expect(400);
    });

    it("rejects an expired token with 400", async () => {
      const { user } = await createUser(ctx, { verified: false });
      await users().update(user.id, { emailVerifyExpires: new Date(Date.now() - 1000) });
      const res = await server().post("/api/auth/verify-email").send({ token: user.emailVerifyToken }).expect(400);
      expect(res.body.error).toMatch(/expired/i);
      expect((await users().findOneByOrFail({ id: user.id })).isEmailVerified).toBe(false);
    });

    it("returns 422 when the token is missing", async () => {
      await server().post("/api/auth/verify-email").send({}).expect(422);
    });
  });

  // ------------------------------------------------------ resend-verification
  describe("POST /api/auth/resend-verification", () => {
    it("issues a new token and emails it for an unverified account", async () => {
      const { email, user } = await createUser(ctx, { verified: false });
      jest.clearAllMocks();
      const res = await server().post("/api/auth/resend-verification").send({ email }).expect(200);
      expect(res.body.data.message).toMatch(/if that account/i);

      const after = await users().findOneByOrFail({ id: user.id });
      expect(after.emailVerifyToken).toBeTruthy();
      expect(after.emailVerifyToken).not.toBe(user.emailVerifyToken);
      expect(ctx.mailer.sendVerificationEmail).toHaveBeenCalledWith(email, after.emailVerifyToken);
    });

    it("gives the same generic answer (and sends nothing) for verified and unknown emails", async () => {
      const { email } = await createUser(ctx);
      jest.clearAllMocks(); // registration itself sent a mail
      const a = await server().post("/api/auth/resend-verification").send({ email }).expect(200);
      const b = await server().post("/api/auth/resend-verification").send({ email: uniqueEmail("ghost") }).expect(200);
      expect(a.body).toEqual(b.body);
      expect(ctx.mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("returns 422 for an invalid email", async () => {
      await server().post("/api/auth/resend-verification").send({ email: "bad" }).expect(422);
    });
  });

  // --------------------------------------------------------- forgot-password
  describe("POST /api/auth/forgot-password", () => {
    it("stores a 1h reset token and emails it", async () => {
      const { email, user } = await createUser(ctx);
      const res = await server().post("/api/auth/forgot-password").send({ email }).expect(200);
      expect(res.body.data.message).toMatch(/if an account exists/i);

      const after = await users().findOneByOrFail({ id: user.id });
      expect(after.resetPasswordToken).toBeTruthy();
      const ms = after.resetPasswordExpires!.getTime() - Date.now();
      expect(ms).toBeGreaterThan(50 * 60 * 1000);
      expect(ms).toBeLessThanOrEqual(60 * 60 * 1000);
      expect(ctx.mailer.sendPasswordResetEmail).toHaveBeenCalledWith(email, after.resetPasswordToken);
    });

    it("responds identically for unknown emails and sends nothing", async () => {
      const known = await createUser(ctx);
      const a = await server().post("/api/auth/forgot-password").send({ email: known.email }).expect(200);
      jest.clearAllMocks();
      const b = await server().post("/api/auth/forgot-password").send({ email: uniqueEmail("ghost") }).expect(200);
      expect(a.body).toEqual(b.body);
      expect(ctx.mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("does not send a reset email to banned users", async () => {
      const { email, user } = await createUser(ctx);
      await users().update(user.id, { isBanned: true });
      await server().post("/api/auth/forgot-password").send({ email }).expect(200);
      expect(ctx.mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("returns 422 for an invalid email", async () => {
      await server().post("/api/auth/forgot-password").send({ email: "bad" }).expect(422);
    });
  });

  // ---------------------------------------------------------- reset-password
  describe("POST /api/auth/reset-password", () => {
    const requestReset = async () => {
      const u = await createUser(ctx);
      await server().post("/api/auth/forgot-password").send({ email: u.email }).expect(200);
      const token = (await users().findOneByOrFail({ id: u.user.id })).resetPasswordToken!;
      return { ...u, token };
    };

    it("changes the password: new works, old no longer does, token is single-use", async () => {
      const { email, password, token } = await requestReset();
      await server().post("/api/auth/reset-password").send({ token, password: "NewPassw0rd" }).expect(200);

      await server().post("/api/auth/login").send({ email, password }).expect(401);
      await server().post("/api/auth/login").send({ email, password: "NewPassw0rd" }).expect(200);

      const again = await server().post("/api/auth/reset-password").send({ token, password: "Another1Pass" }).expect(400);
      expect(again.body.error).toMatch(/invalid|expired/i);
    });

    it("rejects an unknown token with 400", async () => {
      await server().post("/api/auth/reset-password").send({ token: "nope", password: "NewPassw0rd" }).expect(400);
    });

    it("rejects an expired token with 400 and leaves the password unchanged", async () => {
      const { email, password, user, token } = await requestReset();
      await users().update(user.id, { resetPasswordExpires: new Date(Date.now() - 1000) });
      await server().post("/api/auth/reset-password").send({ token, password: "NewPassw0rd" }).expect(400);
      await server().post("/api/auth/login").send({ email, password }).expect(200);
    });

    it.each([
      ["too short", "Ab1"],
      ["no uppercase", "password1"],
      ["no number", "Passwordd"],
    ])("returns 422 for a weak password (%s)", async (_l, password) => {
      const { token } = await requestReset();
      await server().post("/api/auth/reset-password").send({ token, password }).expect(422);
    });

    it("returns 422 when the token is missing", async () => {
      await server().post("/api/auth/reset-password").send({ password: "NewPassw0rd" }).expect(422);
    });
  });

  // ----------------------------------------------------------- delete account
  describe("DELETE /api/auth/account", () => {
    it("requires authentication", async () => {
      const res = await server().delete("/api/auth/account").send({ password: PASSWORD }).expect(401);
      expect(res.body.code).toBe("SESSION_INVALID");
    });

    it("rejects a wrong password with 401 WITHOUT a SESSION_* code (so the UI doesn't auto-logout)", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      const res = await agent.delete("/api/auth/account").send({ password: "WrongPass1" }).expect(401);
      expect(res.body.error).toMatch(/incorrect password/i);
      expect(res.body.code).toBeUndefined();
      expect(await users().findOneBy({ id: user.id })).not.toBeNull();
    });

    it("returns 422 when the password is missing", async () => {
      const { agent } = await createLoggedInUser(ctx);
      await agent.delete("/api/auth/account").send({}).expect(422);
    });

    it("deletes the account and all of its notes, clears the cookie, and blocks further access", async () => {
      const { agent, user, email, password } = await createLoggedInUser(ctx);
      await agent.post("/api/notes").send({ title: "n1", content: "c" }).expect(201);
      await agent.post("/api/notes").send({ title: "n2", content: "c" }).expect(201);

      const res = await agent.delete("/api/auth/account").send({ password }).expect(200);
      expect(res.body.data.message).toMatch(/deleted/i);
      expect(cookieHeader(res)).toMatch(/bp_session=;/);

      expect(await users().findOneBy({ id: user.id })).toBeNull();
      expect(await ctx.dataSource.getRepository(Note).countBy({ authorId: user.id })).toBe(0);
      await server().post("/api/auth/login").send({ email, password }).expect(401);
    });
  });

  it("the seeded admin (from env) can log in and has role ADMIN", async () => {
    const agent = await loginAgent(ctx.app, ADMIN.email, ADMIN.password);
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.data).toMatchObject({ email: ADMIN.email, role: "ADMIN", isEmailVerified: true });
  });
});
