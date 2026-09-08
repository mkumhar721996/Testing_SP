import { escapeHtml } from "../lib/escapeHtml.ts";
import { severityChipClass } from "./chips.ts";

export interface ConfirmedDefect {
  id: string;
  title: string;
  severity: string;
  component: string;
  tester: string;
  status: string;
}

export function renderConfirmation(defect: ConfirmedDefect): string {
  return `
<div class="card" style="max-width: 30rem; margin: var(--space-5) auto;">
  <div class="card-body" style="text-align:center;">
    <h2 style="color: var(--color-success);">&check; Defect created</h2>
    <p class="field-hint">Your defect has been logged and is ready for triage.</p>
    <div class="card" style="text-align:left; margin: var(--space-3) 0;">
      <div class="card-body" style="padding: var(--space-3);">
        <div class="form-group"><span class="label">Defect ID</span><code>${escapeHtml(defect.id)}</code></div>
        <div class="form-group"><span class="label">Title</span>${escapeHtml(defect.title)}</div>
        <div class="form-group"><span class="label">Severity</span><span class="chip ${severityChipClass(defect.severity)}">${escapeHtml(defect.severity)}</span></div>
        <div class="form-group"><span class="label">Affected component</span>${escapeHtml(defect.component)}</div>
        <div class="form-group"><span class="label">Assigned tester</span>${escapeHtml(defect.tester)}</div>
        <div class="form-group"><span class="label">Status</span><span class="chip chip-status-open">${escapeHtml(defect.status)}</span></div>
      </div>
    </div>
    <div style="display:flex; gap: var(--space-2); justify-content:center;">
      <button class="btn btn-primary" id="viewDefectListBtn">View in Defect List</button>
      <button class="btn btn-secondary" id="createAnotherBtn">Create another</button>
    </div>
  </div>
</div>
`.trim();
}
