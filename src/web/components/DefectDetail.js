import { getAllowedTransitions, STATUS_META, ACTION_LABELS } from '../../domain/defectStatus.js';

const NO_ACTIONS_MESSAGE =
  'Status transitions are performed by Developers and Testers. No actions are available to your role.';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHistoryDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

function renderHistoryEntry(entry) {
  const date = formatHistoryDate(entry.timestamp);
  const toLabel = STATUS_META[entry.to].label;
  const text =
    entry.from === null
      ? `Reported by <strong>${escapeHtml(entry.actor)}</strong>, status set to <strong>${toLabel}</strong>.`
      : `<strong>${escapeHtml(entry.actor)}</strong> moved status to <strong>${toLabel}</strong>.`;
  return `<li><time>${date}</time> <span>${text}</span></li>`;
}

function renderActions(role, status) {
  const allowed = getAllowedTransitions(role, status);
  if (allowed.length === 0) {
    return `<p class="no-actions">${NO_ACTIONS_MESSAGE}</p>`;
  }
  return allowed
    .map(
      (target) =>
        `<button class="btn btn-primary btn-sm" data-action="${target}">${ACTION_LABELS[target]}</button>`,
    )
    .join('');
}

export function renderDefectDetail({ defect, role }) {
  const meta = STATUS_META[defect.status];

  return `<div class="card" data-defect-id="${escapeHtml(defect.id)}">
  <div class="card-header">
    <div class="defect-id">${escapeHtml(defect.id)}</div>
    <h2 class="defect-title">${escapeHtml(defect.title)}</h2>
    <div class="row gap-1" style="margin-top: var(--space-2);">
      <span class="chip">Severity: ${escapeHtml(defect.severity)}</span>
      <span class="chip">Component: ${escapeHtml(defect.component)}</span>
    </div>
  </div>
  <div class="card-body">
    <dl class="defect-meta-grid">
      <div><dt>Reporter</dt><dd>${escapeHtml(defect.reporter)}</dd></div>
      <div><dt>Assignee</dt><dd>${escapeHtml(defect.assignee)}</dd></div>
      <div><dt>Created</dt><dd>${escapeHtml(defect.created)}</dd></div>
    </dl>

    <div class="section-block">
      <div class="defect-section-label">Status</div>
      <span class="${meta.chipClass} status-badge">${meta.label}</span>
    </div>

    <div class="section-block">
      <div class="defect-section-label">Actions</div>
      <div class="defect-actions">${renderActions(role, defect.status)}</div>
    </div>

    <div class="section-block">
      <div class="defect-section-label">History</div>
      <ul class="defect-history">
        ${defect.statusHistory.map(renderHistoryEntry).join('\n        ')}
      </ul>
    </div>
  </div>
</div>`;
}
