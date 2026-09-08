import { escapeHtml } from "../lib/escapeHtml.ts";

export interface ShellUser {
  name: string;
  role: string;
}

export type NavId = "dashboard" | "defects" | "create";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function navItem(label: string, id: string, active: boolean, disabled: boolean): string {
  if (disabled) {
    return `<div class="app-nav-item disabled" title="Testers only">${label}</div>`;
  }
  return `<div class="app-nav-item${active ? " active" : ""}" data-nav="${id}">${label}</div>`;
}

export function renderShell(opts: {
  active: NavId[];
  user: ShellUser;
  createDisabled?: boolean;
  main: string;
}): string {
  return `
<div class="app-shell">
  <aside class="app-sidebar">
    <div class="brand">Testing SP</div>
    ${navItem("Dashboard", "dashboard", opts.active.includes("dashboard"), false)}
    ${navItem("Defects", "defects", opts.active.includes("defects"), false)}
    ${navItem("Create Defect", "create", opts.active.includes("create"), Boolean(opts.createDisabled))}
  </aside>
  <div style="flex:1;">
    <div class="app-topbar">
      <div class="user-chip">
        <span class="avatar">${escapeHtml(initials(opts.user.name))}</span>
        <span>${escapeHtml(opts.user.name)}<br><span class="role-tag">${escapeHtml(opts.user.role)}</span></span>
      </div>
      <button class="link-btn" id="logoutBtn">Log out</button>
    </div>
    <div class="app-main">
      ${opts.main}
    </div>
  </div>
</div>
`.trim();
}
