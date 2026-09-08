import { escapeHtml } from "../lib/escapeHtml.ts";
import { TITLE_MAX_LENGTH, STEPS_MAX_LENGTH } from "../lib/validation.ts";
import type { DefectFormErrors } from "../lib/validation.ts";

export const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"];

export const COMPONENT_OPTIONS = [
  "Authentication",
  "Checkout",
  "Search",
  "Notifications",
  "Reporting",
  "Mobile App",
  "API Gateway",
  "Billing",
  "Other",
];

export interface TesterOption {
  name: string;
}

export interface DefectFormValues {
  title: string;
  severity: string;
  tester: string;
  component: string;
  steps: string;
}

export interface RenderFormOptions {
  showSummary?: boolean;
}

function fieldError(id: string, message: string | undefined): string {
  const visible = Boolean(message);
  return `<span class="field-error" id="err${id}" style="display:${visible ? "flex" : "none"};">${
    message ? escapeHtml(message) : ""
  }</span>`;
}

function selectOptions(options: string[], selected: string): string {
  return options
    .map((opt) => `<option value="${escapeHtml(opt)}"${opt === selected ? " selected" : ""}>${escapeHtml(opt)}</option>`)
    .join("");
}

export function renderCreateDefectForm(
  values: DefectFormValues,
  errors: DefectFormErrors,
  activeTesters: TesterOption[],
  options: RenderFormOptions = {},
): string {
  const showSummary = options.showSummary ?? Object.keys(errors).length > 0;
  const titleLen = values.title.length;
  const stepsLen = values.steps.length;

  return `
<div class="alert alert-danger" id="formErrorSummary" style="display:${showSummary ? "block" : "none"};" aria-live="polite">
  Please fix the highlighted field(s) below.
</div>

<form class="card" id="createDefectForm" style="max-width: 40rem;" novalidate>
  <div class="card-body">

    <div class="form-group">
      <label class="label" for="fTitle">Title<span class="required-mark">*</span></label>
      <input class="input${errors.title ? " input-error" : ""}" type="text" id="fTitle" placeholder="Short summary of the defect" value="${escapeHtml(values.title)}" />
      <div style="display:flex; justify-content: space-between;">
        ${fieldError("Title", errors.title)}
        <span class="field-counter${titleLen > TITLE_MAX_LENGTH ? " over-limit" : ""}" id="counterTitle">${titleLen} / ${TITLE_MAX_LENGTH}</span>
      </div>
    </div>

    <div class="form-group">
      <label class="label" for="fSeverity">Severity<span class="required-mark">*</span></label>
      <select class="select${errors.severity ? " select-error" : ""}" id="fSeverity">
        <option value="">&mdash; Select severity &mdash;</option>
        ${selectOptions(SEVERITY_OPTIONS, values.severity)}
      </select>
      ${fieldError("Severity", errors.severity)}
    </div>

    <div class="form-group">
      <label class="label" for="fTester">Assigned tester<span class="required-mark">*</span></label>
      <select class="select${errors.tester ? " select-error" : ""}" id="fTester">
        <option value="">&mdash; Select an active tester &mdash;</option>
        ${selectOptions(activeTesters.map((t) => t.name), values.tester)}
      </select>
      <span class="field-hint">Only testers with Active status appear here.</span>
      ${fieldError("Tester", errors.tester)}
    </div>

    <div class="form-group">
      <label class="label" for="fComponent">Affected component<span class="required-mark">*</span></label>
      <select class="select${errors.component ? " select-error" : ""}" id="fComponent">
        <option value="">&mdash; Select component &mdash;</option>
        ${selectOptions(COMPONENT_OPTIONS, values.component)}
      </select>
      ${fieldError("Component", errors.component)}
    </div>

    <div class="form-group">
      <label class="label" for="fSteps">Steps to reproduce<span class="required-mark">*</span></label>
      <textarea class="textarea${errors.steps ? " textarea-error" : ""}" id="fSteps" placeholder="1. Go to...&#10;2. Click...&#10;3. Observe...">${escapeHtml(values.steps)}</textarea>
      <div style="display:flex; justify-content: space-between;">
        ${fieldError("Steps", errors.steps)}
        <span class="field-counter${stepsLen > STEPS_MAX_LENGTH ? " over-limit" : ""}" id="counterSteps">${stepsLen} / ${STEPS_MAX_LENGTH}</span>
      </div>
    </div>

  </div>
  <div class="card-footer">
    <button type="submit" class="btn btn-primary" id="submitBtn">Submit Defect</button>
    <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
  </div>
</form>
`.trim();
}
