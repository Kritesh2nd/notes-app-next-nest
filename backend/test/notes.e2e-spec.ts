import request from "supertest";
import { createTestApp, TestContext } from "./helpers/create-test-app";
import { createLoggedInUser, createNote } from "./helpers/test-utils";

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

describe("Notes endpoints", () => {
  let ctx: TestContext;
  const server = () => request(ctx.app.getHttpServer());

  beforeAll(async () => (ctx = await createTestApp()));
  afterAll(() => ctx.close());
  beforeEach(() => jest.clearAllMocks());

  describe("authentication", () => {
    it.each([
      ["get", "/api/notes"],
      ["post", "/api/notes"],
      ["get", `/api/notes/${MISSING_ID}`],
      ["patch", `/api/notes/${MISSING_ID}`],
      ["patch", `/api/notes/${MISSING_ID}/favorite`],
      ["delete", `/api/notes/${MISSING_ID}`],
    ] as const)("%s %s requires a session (401)", async (method, url) => {
      const res = await server()[method](url).send({ title: "t", content: "c" }).expect(401);
      expect(res.body).toMatchObject({ success: false, code: "SESSION_INVALID" });
    });
  });

  describe("POST /api/notes", () => {
    it("creates a note owned by the caller and logs 'Note created'", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      const res = await agent.post("/api/notes").send({ title: "Hello", content: "# Markdown **body**" }).expect(201);

      expect(res.body.data).toMatchObject({
        title: "Hello",
        content: "# Markdown **body**",
        isFavorite: false,
        authorId: user.id,
      });
      expect(res.body.data.id).toEqual(expect.any(String));
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Note created", userId: user.id }));
    });

    it("ignores an attacker-supplied authorId / isFavorite", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      const res = await agent
        .post("/api/notes")
        .send({ title: "x", content: "y", authorId: "00000000-0000-4000-8000-000000000001", isFavorite: true })
        .expect(201);
      expect(res.body.data.authorId).toBe(user.id);
      expect(res.body.data.isFavorite).toBe(false);
    });

    it.each([
      ["missing title", { content: "c" }, /title/i],
      ["empty title", { title: "", content: "c" }, /title/i],
      ["title over 120 chars", { title: "x".repeat(121), content: "c" }, /too long/i],
      ["missing content", { title: "t" }, /content/i],
      ["empty content", { title: "t", content: "" }, /content/i],
    ])("returns 422 for %s", async (_l, body, msg) => {
      const { agent } = await createLoggedInUser(ctx);
      const res = await agent.post("/api/notes").send(body).expect(422);
      expect(res.body.error).toMatch(msg);
    });
  });

  describe("GET /api/notes", () => {
    it("returns only the caller's notes, favorites first", async () => {
      const a = await createLoggedInUser(ctx);
      const b = await createLoggedInUser(ctx);
      const n1 = await createNote(a.agent, "first");
      const n2 = await createNote(a.agent, "second");
      await createNote(b.agent, "someone else's");
      await a.agent.patch(`/api/notes/${n1.id}/favorite`).send({ isFavorite: true }).expect(200);

      const res = await a.agent.get("/api/notes").expect(200);
      const titles = res.body.data.map((n: { title: string }) => n.title);
      expect(titles).toEqual(["first", "second"]); // favorite (n1) sorted ahead of newer n2
      expect(res.body.data.every((n: { authorId: string }) => n.authorId === a.user.id)).toBe(true);
      expect(res.body.data.map((n: { id: string }) => n.id)).toEqual([n1.id, n2.id]);
    });

    it("returns an empty array for a new user", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const res = await agent.get("/api/notes").expect(200);
      expect(res.body.data).toEqual([]);
    });

    it("filters by ?favorites=true", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const fav = await createNote(agent, "fav");
      await createNote(agent, "plain");
      await agent.patch(`/api/notes/${fav.id}/favorite`).send({ isFavorite: true }).expect(200);

      const res = await agent.get("/api/notes?favorites=true").expect(200);
      expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(["fav"]);
    });

    it("searches title and content case-insensitively with ?q=", async () => {
      const { agent } = await createLoggedInUser(ctx);
      await createNote(agent, "Grocery list", "milk and eggs");
      await createNote(agent, "Meeting", "discuss the QUARTERLY roadmap");
      await createNote(agent, "Unrelated", "nothing to see");

      const byTitle = await agent.get("/api/notes?q=grocery").expect(200);
      expect(byTitle.body.data.map((n: { title: string }) => n.title)).toEqual(["Grocery list"]);

      const byContent = await agent.get("/api/notes?q=quarterly").expect(200);
      expect(byContent.body.data.map((n: { title: string }) => n.title)).toEqual(["Meeting"]);

      const none = await agent.get("/api/notes?q=zzzzz").expect(200);
      expect(none.body.data).toEqual([]);
    });
  });

  describe("GET /api/notes/:id", () => {
    it("returns the note and logs 'Note read'", async () => {
      const { agent, user } = await createLoggedInUser(ctx);
      const note = await createNote(agent, "Readable", "body");
      jest.clearAllMocks();

      const res = await agent.get(`/api/notes/${note.id}`).expect(200);
      expect(res.body.data).toMatchObject({ id: note.id, title: "Readable", content: "body" });
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Note read", noteId: note.id, userId: user.id }));
    });

    it("returns 404 for another user's note (no existence leak)", async () => {
      const owner = await createLoggedInUser(ctx);
      const other = await createLoggedInUser(ctx);
      const note = await createNote(owner.agent);
      const res = await other.agent.get(`/api/notes/${note.id}`).expect(404);
      expect(res.body).toMatchObject({ success: false, error: "Note not found." });
    });

    it("returns 404 for a well-formed id that doesn't exist", async () => {
      const { agent } = await createLoggedInUser(ctx);
      await agent.get(`/api/notes/${MISSING_ID}`).expect(404);
    });

    it("returns 400 (not 500) for a malformed id", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const res = await agent.get("/api/notes/not-a-uuid").expect(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/notes/:id", () => {
    it("updates title and content and logs 'Note updated'", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent, "Old", "old body");

      const res = await agent.patch(`/api/notes/${note.id}`).send({ title: "New", content: "new body" }).expect(200);
      expect(res.body.data).toMatchObject({ id: note.id, title: "New", content: "new body" });

      const fetched = await agent.get(`/api/notes/${note.id}`).expect(200);
      expect(fetched.body.data.title).toBe("New");
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Note updated", noteId: note.id }));
    });

    it("does not let a caller reassign ownership", async () => {
      const a = await createLoggedInUser(ctx);
      const b = await createLoggedInUser(ctx);
      const note = await createNote(a.agent);
      const res = await a.agent.patch(`/api/notes/${note.id}`).send({ title: "t", content: "c", authorId: b.user.id }).expect(200);
      expect(res.body.data.authorId).toBe(a.user.id);
    });

    it("returns 404 when editing another user's note, and leaves it untouched", async () => {
      const owner = await createLoggedInUser(ctx);
      const other = await createLoggedInUser(ctx);
      const note = await createNote(owner.agent, "Mine", "keep");
      await other.agent.patch(`/api/notes/${note.id}`).send({ title: "hacked", content: "hacked" }).expect(404);
      const still = await owner.agent.get(`/api/notes/${note.id}`).expect(200);
      expect(still.body.data.title).toBe("Mine");
    });

    it("returns 404 for a missing note and 400 for a malformed id", async () => {
      const { agent } = await createLoggedInUser(ctx);
      await agent.patch(`/api/notes/${MISSING_ID}`).send({ title: "t", content: "c" }).expect(404);
      await agent.patch("/api/notes/nope").send({ title: "t", content: "c" }).expect(400);
    });

    it("returns 422 for invalid bodies", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent);
      await agent.patch(`/api/notes/${note.id}`).send({ title: "", content: "c" }).expect(422);
      await agent.patch(`/api/notes/${note.id}`).send({ title: "t" }).expect(422);
    });
  });

  describe("PATCH /api/notes/:id/favorite", () => {
    it("sets favorite explicitly, and is idempotent", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent);
      const on = await agent.patch(`/api/notes/${note.id}/favorite`).send({ isFavorite: true }).expect(200);
      expect(on.body.data.isFavorite).toBe(true);
      const again = await agent.patch(`/api/notes/${note.id}/favorite`).send({ isFavorite: true }).expect(200);
      expect(again.body.data.isFavorite).toBe(true);
      const off = await agent.patch(`/api/notes/${note.id}/favorite`).send({ isFavorite: false }).expect(200);
      expect(off.body.data.isFavorite).toBe(false);
    });

    it("toggles when no value is supplied", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent);
      const a = await agent.patch(`/api/notes/${note.id}/favorite`).send({}).expect(200);
      expect(a.body.data.isFavorite).toBe(true);
      const b = await agent.patch(`/api/notes/${note.id}/favorite`).send({}).expect(200);
      expect(b.body.data.isFavorite).toBe(false);
    });

    it("returns 422 when isFavorite is not a boolean", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent);
      await agent.patch(`/api/notes/${note.id}/favorite`).send({ isFavorite: "yes" }).expect(422);
    });

    it("returns 404 for another user's note and 400 for a malformed id", async () => {
      const owner = await createLoggedInUser(ctx);
      const other = await createLoggedInUser(ctx);
      const note = await createNote(owner.agent);
      await other.agent.patch(`/api/notes/${note.id}/favorite`).send({ isFavorite: true }).expect(404);
      await owner.agent.patch("/api/notes/nope/favorite").send({}).expect(400);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("deletes the note and logs 'Note deleted'", async () => {
      const { agent } = await createLoggedInUser(ctx);
      const note = await createNote(agent);
      const res = await agent.delete(`/api/notes/${note.id}`).expect(200);
      expect(res.body.data.message).toMatch(/deleted/i);
      await agent.get(`/api/notes/${note.id}`).expect(404);
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ event: "Note deleted", noteId: note.id }));
    });

    it("returns 404 when deleting twice, another user's note, or a malformed id", async () => {
      const owner = await createLoggedInUser(ctx);
      const other = await createLoggedInUser(ctx);
      const note = await createNote(owner.agent);

      await other.agent.delete(`/api/notes/${note.id}`).expect(404);
      await owner.agent.get(`/api/notes/${note.id}`).expect(200); // still there

      await owner.agent.delete(`/api/notes/${note.id}`).expect(200);
      await owner.agent.delete(`/api/notes/${note.id}`).expect(404);
      await owner.agent.delete("/api/notes/nope").expect(400);
    });
  });
});
