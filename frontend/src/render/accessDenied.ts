export function renderAccessDenied(): string {
  return `
<div class="app-nav-item disabled" title="Testers only">Create Defect</div>
<div class="card" style="max-width: 34rem;">
  <div class="card-body" style="text-align:center; padding: var(--space-5);">
    <h2 style="color: var(--color-danger);">Access denied</h2>
    <p>
      Only testers can create defects. Your current role does not have permission
      to open the defect creation form. If you believe this is incorrect, contact
      your QA lead to update your role.
    </p>
    <button class="btn btn-secondary" id="backToDashboardBtn">Back to Dashboard</button>
  </div>
</div>
`.trim();
}
