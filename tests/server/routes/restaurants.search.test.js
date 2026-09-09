import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../../../src/server/app.js";

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(createApp());
    server.listen(0, () => resolve(server));
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

const AUTH_HEADERS = { cookie: "session=logged-in-customer" };

test("GET /api/restaurants/search rejects unauthenticated requests", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://localhost:${port}/api/restaurants/search?q=burger`);

    assert.equal(response.status, 401);
  } finally {
    await stopServer(server);
  }
});

test("GET /api/restaurants/search returns ranked results with all display fields", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://localhost:${port}/api/restaurants/search?q=burger`, {
      headers: AUTH_HEADERS,
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.results));
    assert.ok(body.results.length > 0);
    for (const restaurant of body.results) {
      assert.equal(typeof restaurant.name, "string");
      assert.equal(typeof restaurant.cuisine, "string");
      assert.equal(typeof restaurant.rating, "number");
      assert.equal(typeof restaurant.estimatedDeliveryMinutes, "number");
      assert.equal(typeof restaurant.deliveryFeeCents, "number");
      assert.equal(typeof restaurant.isOpen, "boolean");
    }
  } finally {
    await stopServer(server);
  }
});

test("GET /api/restaurants/search returns an empty results array when nothing matches", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(
      `http://localhost:${port}/api/restaurants/search?q=nonexistent-cuisine-xyz`,
      { headers: AUTH_HEADERS },
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.results, []);
  } finally {
    await stopServer(server);
  }
});

test("GET /api/restaurants/search includes closed restaurants clearly marked as unavailable", async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://localhost:${port}/api/restaurants/search?q=burger`, {
      headers: AUTH_HEADERS,
    });
    const body = await response.json();

    assert.ok(body.results.some((restaurant) => restaurant.isOpen === false));
  } finally {
    await stopServer(server);
  }
});
