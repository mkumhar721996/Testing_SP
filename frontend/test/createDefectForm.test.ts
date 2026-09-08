import test from "node:test";
import assert from "node:assert/strict";
import {
  renderCreateDefectForm,
  SEVERITY_OPTIONS,
  COMPONENT_OPTIONS,
} from "../src/render/createDefectForm.ts";

const emptyValues = { title: "", severity: "", tester: "", component: "", steps: "" };
const activeTesters = [
  { name: "Jordan Blake" },
  { name: "Priya Nandakumar" },
  { name: "Sam O'Connell" },
  { name: "Wei Zhang" },
];

test("renders all five required fields with the design's exact labels and control types (AC1)", () => {
  const html = renderCreateDefectForm(emptyValues, {}, activeTesters);

  assert.match(html, /<label[^>]*for="fTitle"[^>]*>Title/);
  const titleInput = html.match(/<input[^>]*id="fTitle"[^>]*>/);
  assert.ok(titleInput, "expected an fTitle <input>");
  assert.match(titleInput![0], /type="text"/);

  assert.match(html, /<label[^>]*for="fSeverity"[^>]*>Severity/);
  assert.match(html, /<select[^>]*id="fSeverity"/);

  assert.match(html, /<label[^>]*for="fTester"[^>]*>Assigned tester/);
  assert.match(html, /<select[^>]*id="fTester"/);

  assert.match(html, /<label[^>]*for="fComponent"[^>]*>Affected component/);
  assert.match(html, /<select[^>]*id="fComponent"/);

  assert.match(html, /<label[^>]*for="fSteps"[^>]*>Steps to reproduce/);
  assert.match(html, /<textarea[^>]*id="fSteps"/);
});

test("submitting an empty form shows all five field errors and the summary banner (AC2)", () => {
  const errors = {
    title: "Title is required.",
    severity: "Severity is required.",
    tester: "Assigned tester is required.",
    component: "Affected component is required.",
    steps: "Steps to reproduce are required.",
  };
  const html = renderCreateDefectForm(emptyValues, errors, activeTesters, { showSummary: true });

  assert.match(html, /Title is required\./);
  assert.match(html, /Severity is required\./);
  assert.match(html, /Assigned tester is required\./);
  assert.match(html, /Affected component is required\./);
  assert.match(html, /Steps to reproduce are required\./);
  assert.match(html, /Please fix the highlighted field\(s\) below\./);
});

test("a valid form with no errors keeps the error summary hidden", () => {
  const html = renderCreateDefectForm(emptyValues, {}, activeTesters, { showSummary: false });
  assert.match(html, /id="formErrorSummary" style="display:none;"/);
});

test("shows an over-limit title counter and error when title is 101 characters (AC8)", () => {
  const title = "T".repeat(101);
  const errors = { title: `Title must be 100 characters or fewer (currently 101).` };
  const html = renderCreateDefectForm({ ...emptyValues, title }, errors, activeTesters, { showSummary: true });

  assert.match(html, /101 \/ 100/);
  assert.match(html, /Title must be 100 characters or fewer \(currently 101\)\./);
});

test("shows an over-limit steps counter and error when steps is 2001 characters (AC10)", () => {
  const steps = "S".repeat(2001);
  const errors = { steps: `Steps to reproduce must be 2000 characters or fewer (currently 2001).` };
  const html = renderCreateDefectForm({ ...emptyValues, steps }, errors, activeTesters, { showSummary: true });

  assert.match(html, /2001 \/ 2000/);
  assert.match(html, /Steps to reproduce must be 2000 characters or fewer \(currently 2001\)\./);
});

test("assigned tester is a closed dropdown of only active testers with no free-text input (AC11)", () => {
  const html = renderCreateDefectForm(emptyValues, {}, activeTesters);
  const selectMatch = html.match(/<select[^>]*id="fTester"[\s\S]*?<\/select>/);

  assert.ok(selectMatch, "expected an fTester <select> element");
  const selectHtml = selectMatch![0];

  for (const tester of activeTesters) {
    assert.match(selectHtml, new RegExp(`<option[^>]*>${tester.name.replace(/'/g, "&#39;")}</option>`));
  }
  assert.doesNotMatch(html, /<input[^>]*id="fTester"/);
});

test("severity options match Critical, High, Medium, Low in order", () => {
  assert.deepEqual(SEVERITY_OPTIONS, ["Critical", "High", "Medium", "Low"]);
});

test("component options are the design's fixed closed list", () => {
  assert.deepEqual(COMPONENT_OPTIONS, [
    "Authentication",
    "Checkout",
    "Search",
    "Notifications",
    "Reporting",
    "Mobile App",
    "API Gateway",
    "Billing",
    "Other",
  ]);
});

test("escapes user-entered title text to avoid injecting markup", () => {
  const html = renderCreateDefectForm({ ...emptyValues, title: "<script>alert(1)</script>" }, {}, activeTesters);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});
