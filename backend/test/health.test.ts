import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/app.ts";

test("GET /health returns ok status", async () => {
  const server = createServer(createApp("http://localhost:3001"));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as { port: number };

  const res = await fetch(`http://localhost:${port}/health`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body, { status: "ok" });

  await new Promise<void>((resolve) => server.close(() => resolve()));
});
