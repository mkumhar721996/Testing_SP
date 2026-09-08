import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, extractSessionCookie } from "./test-helpers.ts";

test("POST /api/auth/login with valid tester credentials returns the user and a session cookie", async () => {
  const server = await startTestServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jordan.blake@testingsp.example", password: "test-password" }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.user.name, "Jordan Blake");
    assert.equal(body.user.role, "Tester");
    assert.match(extractSessionCookie(res), /^sid=/);
  } finally {
    await server.close();
  }
});

test("POST /api/auth/login with invalid credentials is rejected", async () => {
  const server = await startTestServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jordan.blake@testingsp.example", password: "wrong" }),
    });

    assert.equal(res.status, 401);
  } finally {
    await server.close();
  }
});

test("GET /api/auth/me without a session is unauthenticated", async () => {
  const server = await startTestServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  } finally {
    await server.close();
  }
});

test("GET /api/auth/me with a valid session cookie returns the signed-in user's role", async () => {
  const server = await startTestServer();
  try {
    const loginRes = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex.kim@testingsp.example", password: "test-password" }),
    });
    const cookie = extractSessionCookie(loginRes);

    const meRes = await fetch(`${server.baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    const body = await meRes.json();

    assert.equal(meRes.status, 200);
    assert.equal(body.user.name, "Alex Kim");
    assert.equal(body.user.role, "Developer");
  } finally {
    await server.close();
  }
});
