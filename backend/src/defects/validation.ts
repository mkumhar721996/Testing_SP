import type { DefectInput } from "./model.ts";

export const TITLE_MAX_LENGTH = 100;
export const STEPS_MAX_LENGTH = 2000;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateDefectInput(input: Partial<DefectInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const title = asString(input.title);
  const severity = asString(input.severity);
  const tester = asString(input.tester);
  const component = asString(input.component);
  const steps = asString(input.steps);

  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer (currently ${title.length}).`;
  }

  if (!severity) {
    errors.severity = "Severity is required.";
  }

  if (!tester) {
    errors.tester = "Assigned tester is required.";
  }

  if (!component) {
    errors.component = "Affected component is required.";
  }

  if (!steps) {
    errors.steps = "Steps to reproduce are required.";
  } else if (steps.length > STEPS_MAX_LENGTH) {
    errors.steps = `Steps to reproduce must be ${STEPS_MAX_LENGTH} characters or fewer (currently ${steps.length}).`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
