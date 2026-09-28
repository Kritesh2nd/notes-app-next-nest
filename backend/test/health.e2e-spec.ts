import request from "supertest";
import { createTestApp, TestContext } from "./helpers/create-test-app";

describe("GET /api/health", () => {
  let ctx: TestContext;
  beforeAll(async () => (ctx = await createTestApp()));
  afterAll(() => ctx.close());

  it("returns ok without authentication", async () => {
    const res = await request(ctx.app.getHttpServer()).get("/api/health").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("blueprint-notes-api");
  });

  it("returns 404 in the standard error envelope for unknown routes", async () => {
    const res = await request(ctx.app.getHttpServer()).get("/api/nope").expect(404);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe("string");
  });
});
