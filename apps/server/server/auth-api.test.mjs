import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createAuthRouter } from "./auth-api.mjs";

const servers = [];

async function postForgotPassword(pool) {
  const app = express();
  app.use(express.json());
  app.use("/api", createAuthRouter(pool, new Set(["http://localhost:5174"])));
  const server = app.listen(0);
  servers.push(server);
  const { port } = server.address();

  return fetch(`http://127.0.0.1:${port}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5174",
    },
    body: JSON.stringify({ email: "unknown@example.org" }),
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
});

describe("native authentication API", () => {
  it("serves forgot-password under /api/auth and keeps account lookup private", async () => {
    const pool = {
      query: async () => ({ rows: [] }),
    };

    const response = await postForgotPassword(pool);

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("returns a service error instead of a misleading 404 when the database is not configured", async () => {
    const response = await postForgotPassword(null);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("DATABASE_URL"),
    });
  });
});
