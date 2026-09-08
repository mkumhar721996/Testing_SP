import test from "node:test";
import assert from "node:assert/strict";
import { renderDefectList } from "../src/render/defectList.ts";

test("renders a row with title, severity, component, assigned tester and status Open (AC6)", () => {
  const html = renderDefectList([
    {
      id: "DEF-104",
      title: "Login session expires prematurely on mobile Safari",
      severity: "High",
      component: "Authentication",
      tester: "Wei Zhang",
      status: "Open",
    },
  ]);

  assert.match(html, /DEF-104/);
  assert.match(html, /Login session expires prematurely on mobile Safari/);
  assert.match(html, /chip-sev-high">High<\/span>/);
  assert.match(html, /Authentication/);
  assert.match(html, /Wei Zhang/);
  assert.match(html, /chip-status-open">Open<\/span>/);
});

test("two defects with the same title/details are both listed as separate rows with no duplicate-warning UI (AC14)", () => {
  const html = renderDefectList([
    { id: "DEF-104", title: "Duplicate title example", severity: "Low", component: "Other", tester: "Jordan Blake", status: "Open" },
    { id: "DEF-105", title: "Duplicate title example", severity: "Low", component: "Other", tester: "Jordan Blake", status: "Open" },
  ]);

  const rowCount = html.split("Duplicate title example").length - 1;
  assert.equal(rowCount, 2);

  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)![1];
  const rows = tbody.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  assert.equal(rows.length, 2);
  for (const rowHtml of rows) {
    assert.doesNotMatch(rowHtml, /warning/i);
  }
});

test("renders the design's column headers", () => {
  const html = renderDefectList([]);
  for (const header of ["ID", "Title", "Severity", "Component", "Assigned tester", "Status"]) {
    assert.match(html, new RegExp(`<th>${header}</th>`));
  }
});
