import { escapeHtml } from "../lib/escapeHtml.ts";
import { severityChipClass, statusChipClass } from "./chips.ts";

export interface DefectListItem {
  id: string;
  title: string;
  severity: string;
  component: string;
  tester: string;
  status: string;
}

function row(defect: DefectListItem): string {
  return `
<tr>
  <td><code>${escapeHtml(defect.id)}</code></td>
  <td>${escapeHtml(defect.title)}</td>
  <td><span class="chip ${severityChipClass(defect.severity)}">${escapeHtml(defect.severity)}</span></td>
  <td>${escapeHtml(defect.component)}</td>
  <td>${escapeHtml(defect.tester)}</td>
  <td><span class="chip ${statusChipClass(defect.status)}">${escapeHtml(defect.status)}</span></td>
</tr>`;
}

export function renderDefectList(defects: DefectListItem[]): string {
  return `
<div style="display:flex; align-items:center; justify-content: space-between;">
  <h1>Defects</h1>
  <button class="btn btn-primary" id="createDefectLinkBtn">+ Create Defect</button>
</div>
<p class="field-hint" style="margin-bottom: var(--space-3);">
  Visible to any authenticated user. Duplicate titles are listed as separate defects without a warning.
</p>
<div class="card">
  <table class="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Severity</th>
        <th>Component</th>
        <th>Assigned tester</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody id="defectTableBody">${defects.map(row).join("")}</tbody>
  </table>
</div>
`.trim();
}
