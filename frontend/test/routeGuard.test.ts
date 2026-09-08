import test from "node:test";
import assert from "node:assert/strict";
import {
  guardCreateDefectRoute,
  buildLoginRedirectUrl,
  resolvePostLoginDestination,
} from "../src/lib/routeGuard.ts";

test("an unauthenticated visitor is redirected to login (AC12)", () => {
  const result = guardCreateDefectRoute({ isAuthenticated: false });
  assert.deepEqual(result, { type: "redirect-login" });
});

test("an authenticated Developer is denied access (AC5)", () => {
  const result = guardCreateDefectRoute({ isAuthenticated: true, role: "Developer" });
  assert.deepEqual(result, { type: "access-denied" });
});

test("an authenticated Manager is denied access (AC5)", () => {
  const result = guardCreateDefectRoute({ isAuthenticated: true, role: "Manager" });
  assert.deepEqual(result, { type: "access-denied" });
});

test("an authenticated Tester is allowed", () => {
  const result = guardCreateDefectRoute({ isAuthenticated: true, role: "Tester" });
  assert.deepEqual(result, { type: "allow" });
});

test("buildLoginRedirectUrl encodes the original destination", () => {
  assert.equal(buildLoginRedirectUrl("/defects/new"), "/login?returnTo=%2Fdefects%2Fnew");
});

test("resolvePostLoginDestination returns the original destination after login (AC13)", () => {
  assert.equal(resolvePostLoginDestination("/defects/new"), "/defects/new");
});

test("resolvePostLoginDestination falls back to the defect list when there is no safe returnTo", () => {
  assert.equal(resolvePostLoginDestination(null), "/defects");
  assert.equal(resolvePostLoginDestination("https://evil.example"), "/defects");
});
