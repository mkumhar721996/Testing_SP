export const TITLE_MAX_LENGTH = 100;
export const STEPS_MAX_LENGTH = 2000;

export interface DefectFormInput {
  title: string;
  severity: string;
  tester: string;
  component: string;
  steps: string;
}

export interface DefectFormErrors {
  title?: string;
  severity?: string;
  tester?: string;
  component?: string;
  steps?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: DefectFormErrors;
}

export function validateDefectInput(input: DefectFormInput): ValidationResult {
  const errors: DefectFormErrors = {};

  const title = input.title.trim();
  const severity = input.severity.trim();
  const tester = input.tester.trim();
  const component = input.component.trim();
  const steps = input.steps.trim();

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
