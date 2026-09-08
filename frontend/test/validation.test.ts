import test from "node:test";
import assert from "node:assert/strict";
import { validateDefectInput } from "../src/lib/validation.ts";

test("all five fields empty produces a distinct error per field (AC2)", () => {
  const { valid, errors } = validateDefectInput({
    title: "",
    severity: "",
    tester: "",
    component: "",
    steps: "",
  });

  assert.equal(valid, false);
  assert.equal(errors.title, "Title is required.");
  assert.equal(errors.severity, "Severity is required.");
  assert.equal(errors.tester, "Assigned tester is required.");
  assert.equal(errors.component, "Affected component is required.");
  assert.equal(errors.steps, "Steps to reproduce are required.");
});

test("a fully populated form is valid", () => {
  const { valid, errors } = validateDefectInput({
    title: "Short title",
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "1. Do a thing.",
  });

  assert.equal(valid, true);
  assert.deepEqual(errors, {});
});

test("title of exactly 100 characters is valid (AC7)", () => {
  const { valid, errors } = validateDefectInput({
    title: "T".repeat(100),
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "steps",
  });

  assert.equal(valid, true);
  assert.equal(errors.title, undefined);
});

test("title of 101 characters is invalid with the 100-char limit message (AC8)", () => {
  const { valid, errors } = validateDefectInput({
    title: "T".repeat(101),
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "steps",
  });

  assert.equal(valid, false);
  assert.equal(errors.title, "Title must be 100 characters or fewer (currently 101).");
});

test("steps of exactly 2000 characters is valid (AC9)", () => {
  const { valid, errors } = validateDefectInput({
    title: "Title",
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "S".repeat(2000),
  });

  assert.equal(valid, true);
  assert.equal(errors.steps, undefined);
});

test("steps of 2001 characters is invalid with the 2000-char limit message (AC10)", () => {
  const { valid, errors } = validateDefectInput({
    title: "Title",
    severity: "High",
    tester: "Wei Zhang",
    component: "Authentication",
    steps: "S".repeat(2001),
  });

  assert.equal(valid, false);
  assert.equal(errors.steps, "Steps to reproduce must be 2000 characters or fewer (currently 2001).");
});
