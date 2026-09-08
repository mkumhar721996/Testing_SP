import test from "node:test";
import assert from "node:assert/strict";
import { users, findUserByCredentials } from "../src/auth/users.ts";

const DEMO_PASSWORD = "test-password";

test("seeded users never store the plaintext demo password", () => {
  for (const user of users) {
    const stored = JSON.stringify(user);
    assert.doesNotMatch(stored, new RegExp(DEMO_PASSWORD));
  }
});

test("findUserByCredentials still authenticates with the correct demo password", () => {
  const user = findUserByCredentials("jordan.blake@testingsp.example", DEMO_PASSWORD);
  assert.ok(user);
  assert.equal(user!.name, "Jordan Blake");
});

test("findUserByCredentials rejects an incorrect password", () => {
  const user = findUserByCredentials("jordan.blake@testingsp.example", "wrong-password");
  assert.equal(user, undefined);
});
