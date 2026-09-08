import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, loginAs } from "./test-helpers.ts";

test("GET /api/testers?status=active excludes inactive testers (AC11)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, "jordan.blake@testingsp.example");
    const res = await fetch(`${server.baseUrl}/api/testers?status=active`, {
      headers: { Cookie: cookie },
    });
    const body = await res.json();
    const names: string[] = body.testers.map((t: { name: string }) => t.name);

    assert.equal(res.status, 200);
    assert.ok(names.includes("Jordan Blake"));
    assert.ok(!names.includes("Riley Chen"), "inactive tester Riley Chen must be excluded");
  } finally {
    await server.close();
  }
});

test("GET /api/testers requires authentication", async () => {
  const server = await startTestServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/testers?status=active`);
    assert.equal(res.status, 401);
  } finally {
    await server.close();
  }
});
