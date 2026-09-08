import test from "node:test";
import assert from "node:assert/strict";
import { renderConfirmation } from "../src/render/confirmation.ts";

const defect = {
  id: "DEF-104",
  title: "Login session expires prematurely on mobile Safari",
  severity: "High",
  component: "Authentication",
  tester: "Wei Zhang",
  status: "Open",
};

test("shows the created defect's id, title, severity, component, tester and status Open (AC3, AC4)", () => {
  const html = renderConfirmation(defect);

  assert.match(html, /Defect created/);
  assert.match(html, /DEF-104/);
  assert.match(html, /Login session expires prematurely on mobile Safari/);
  assert.match(html, /chip-sev-high">High<\/span>/);
  assert.match(html, /Authentication/);
  assert.match(html, /Wei Zhang/);
  assert.match(html, /chip-status-open">Open<\/span>/);
});

test("offers actions to view the defect list or create another", () => {
  const html = renderConfirmation(defect);
  assert.match(html, /View in Defect List/);
  assert.match(html, /Create another/);
});
