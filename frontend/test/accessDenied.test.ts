import test from "node:test";
import assert from "node:assert/strict";
import { renderAccessDenied } from "../src/render/accessDenied.ts";

test("shows the access-denied heading and exact copy from the design (AC5)", () => {
  const html = renderAccessDenied();

  assert.match(html, /Access denied/);
  assert.match(html, /Only testers can create defects\./);
  assert.match(html, /Your current role does not have permission/);
  assert.match(html, /contact[\s\S]*your QA lead to update your role\./);
  assert.match(html, /Back to Dashboard/);
});

test("shows the Create Defect nav item as disabled for non-testers", () => {
  const html = renderAccessDenied();
  assert.match(html, /app-nav-item disabled/);
});
