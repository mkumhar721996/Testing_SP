import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, loginAs } from "./test-helpers.ts";
import { resetDefectsForTests } from "../src/defects/repository.ts";

const TESTER_EMAIL = "jordan.blake@testingsp.example";

test.beforeEach(() => {
  resetDefectsForTests();
});

function validPayload(overrides: Partial<Record<string, string>> = {}) {
  return {
    title: "Login session expires prematurely on mobile Safari",
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "1. Sign in on an iPhone using Safari.\n2. Lock the device.\n3. Reopen the app.\n4. Observe the session already expired.",
    ...overrides,
  };
}

test("POST /api/defects with all fields empty returns 422 with a distinct error per field and creates nothing (AC2)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);

    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ title: "", severity: "", tester: "", component: "", steps: "" }),
    });
    const body = await res.json();

    assert.equal(res.status, 422);
    assert.equal(body.errors.title, "Title is required.");
    assert.equal(body.errors.severity, "Severity is required.");
    assert.equal(body.errors.tester, "Assigned tester is required.");
    assert.equal(body.errors.component, "Affected component is required.");
    assert.equal(body.errors.steps, "Steps to reproduce are required.");

    const listRes = await fetch(`${server.baseUrl}/api/defects`, { headers: { Cookie: cookie } });
    const listBody = await listRes.json();
    assert.equal(listBody.defects.length, 0);
  } finally {
    await server.close();
  }
});

test("POST /api/defects with all fields populated creates a defect with status Open (AC3)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload()),
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.defect.status, "Open");
    assert.ok(body.defect.id);
  } finally {
    await server.close();
  }
});

test("POST /api/defects as Developer is denied with 403 (AC5)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, "alex.kim@testingsp.example");
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload()),
    });

    assert.equal(res.status, 403);
  } finally {
    await server.close();
  }
});

test("POST /api/defects as Manager is denied with 403 (AC5)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, "morgan.lee@testingsp.example");
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload()),
    });

    assert.equal(res.status, 403);
  } finally {
    await server.close();
  }
});

test("GET /api/defects includes a created defect's title, severity, component, tester and status (AC6)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload({ title: "Checkout button unresponsive on Safari" })),
    });

    const managerCookie = await loginAs(server.baseUrl, "morgan.lee@testingsp.example");
    const res = await fetch(`${server.baseUrl}/api/defects`, { headers: { Cookie: managerCookie } });
    const body = await res.json();
    const found = body.defects.find((d: { title: string }) => d.title === "Checkout button unresponsive on Safari");

    assert.equal(res.status, 200);
    assert.ok(found);
    assert.equal(found.severity, "High");
    assert.equal(found.component, "Authentication");
    assert.equal(found.tester, "Wei Zhang");
    assert.equal(found.status, "Open");
  } finally {
    await server.close();
  }
});

test("POST /api/defects with a title of exactly 100 characters succeeds (AC7)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const title = "T".repeat(100);
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload({ title })),
    });

    assert.equal(res.status, 201);
  } finally {
    await server.close();
  }
});

test("POST /api/defects with a title of 101 characters is rejected with the 100-char limit error (AC8)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const title = "T".repeat(101);
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload({ title })),
    });
    const body = await res.json();

    assert.equal(res.status, 422);
    assert.match(body.errors.title, /100 characters/);

    const listRes = await fetch(`${server.baseUrl}/api/defects`, { headers: { Cookie: cookie } });
    const listBody = await listRes.json();
    assert.equal(listBody.defects.some((d: { title: string }) => d.title === title), false);
  } finally {
    await server.close();
  }
});

test("POST /api/defects with steps of exactly 2000 characters succeeds (AC9)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const steps = "S".repeat(2000);
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload({ steps })),
    });

    assert.equal(res.status, 201);
  } finally {
    await server.close();
  }
});

test("POST /api/defects with steps of 2001 characters is rejected with the 2000-char limit error (AC10)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const steps = "S".repeat(2001);
    const title = "Steps too long AC10 case";
    const res = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(validPayload({ title, steps })),
    });
    const body = await res.json();

    assert.equal(res.status, 422);
    assert.match(body.errors.steps, /2000 characters/);

    const listRes = await fetch(`${server.baseUrl}/api/defects`, { headers: { Cookie: cookie } });
    const listBody = await listRes.json();
    assert.equal(listBody.defects.some((d: { title: string }) => d.title === title), false);
  } finally {
    await server.close();
  }
});

test("POST /api/defects twice with identical title/details creates two distinct defects with no duplicate warning (AC14)", async () => {
  const server = await startTestServer();
  try {
    const cookie = await loginAs(server.baseUrl, TESTER_EMAIL);
    const payload = validPayload({ title: "Duplicate title example" });

    const res1 = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(payload),
    });
    const body1 = await res1.json();

    const res2 = await fetch(`${server.baseUrl}/api/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(payload),
    });
    const body2 = await res2.json();

    assert.equal(res1.status, 201);
    assert.equal(res2.status, 201);
    assert.notEqual(body1.defect.id, body2.defect.id);
    assert.equal("warning" in body1.defect, false);
    assert.equal("warning" in body2.defect, false);

    const listRes = await fetch(`${server.baseUrl}/api/defects`, { headers: { Cookie: cookie } });
    const listBody = await listRes.json();
    const matches = listBody.defects.filter((d: { title: string }) => d.title === "Duplicate title example");
    assert.equal(matches.length, 2);
  } finally {
    await server.close();
  }
});
