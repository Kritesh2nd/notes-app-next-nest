import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { User } from "../../src/entities/user.entity";
import { TestContext } from "./create-test-app";

export const PASSWORD = "Password1";
export const ADMIN = { email: "admin@test.dev", password: "Admin@12345" };

let counter = 0;
export const uniqueEmail = (prefix = "user") => `${prefix}${Date.now()}${++counter}@test.dev`;

/** Register + verify + log in. Returns a supertest agent that carries the session cookie. */
export async function createUser(ctx: TestContext, opts: { verified?: boolean; password?: string; name?: string } = {}) {
  const email = uniqueEmail();
  const password = opts.password ?? PASSWORD;
  await request(ctx.app.getHttpServer())
    .post("/api/auth/register")
    .send({ name: opts.name ?? "Test User", email, password })
    .expect(201);

  const users = ctx.dataSource.getRepository(User);
  if (opts.verified !== false) {
    await users.update({ email }, { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null });
  }
  const user = (await users.findOneByOrFail({ email })) as User;
  return { email, password, user };
}

export async function loginAgent(app: INestApplication, email: string, password: string) {
  const agent = request.agent(app.getHttpServer());
  await agent.post("/api/auth/login").send({ email, password }).expect(200);
  return agent;
}

export async function createLoggedInUser(ctx: TestContext) {
  const { email, password, user } = await createUser(ctx);
  const agent = await loginAgent(ctx.app, email, password);
  return { agent, email, password, user };
}

export async function adminAgent(ctx: TestContext) {
  return loginAgent(ctx.app, ADMIN.email, ADMIN.password);
}

export async function createNote(agent: ReturnType<typeof request.agent>, title = "Title", content = "# Body") {
  const res = await agent.post("/api/notes").send({ title, content }).expect(201);
  return res.body.data as { id: string; title: string; content: string; isFavorite: boolean; authorId: string };
}

export const countRows = (ds: DataSource, entity: unknown) => ds.getRepository(entity as never).count();
