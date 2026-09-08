import test from "node:test";
import assert from "node:assert/strict";
import { renderLoginPage } from "../src/render/loginPage.ts";

test("shows the redirected-from-Create-Defect banner when returning from that route (AC13)", () => {
  const html = renderLoginPage({ redirectedFromCreateDefect: true });
  assert.match(
    html,
    /You were redirected from[\s\S]*Create Defect[\s\S]*Signing in will return you[\s\S]*there automatically/,
  );
});

test("hides the redirect banner when arriving at login directly", () => {
  const html = renderLoginPage({ redirectedFromCreateDefect: false });
  assert.doesNotMatch(html, /You were redirected from/);
});

test("always shows email and password fields", () => {
  const html = renderLoginPage({ redirectedFromCreateDefect: false });
  assert.match(html, /type="email"/);
  assert.match(html, /type="password"/);
});
