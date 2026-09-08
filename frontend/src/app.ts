import { fetchMe, login, fetchActiveTesters, fetchDefects, submitDefect } from "./lib/api.ts";
import { guardCreateDefectRoute, buildLoginRedirectUrl, resolvePostLoginDestination } from "./lib/routeGuard.ts";
import { validateDefectInput } from "./lib/validation.ts";
import type { DefectFormValues, DefectFormErrors } from "./lib/validation.ts";
import { renderShell } from "./render/shell.ts";
import { renderCreateDefectForm, type TesterOption } from "./render/createDefectForm.ts";
import { renderConfirmation } from "./render/confirmation.ts";
import { renderAccessDenied } from "./render/accessDenied.ts";
import { renderDefectList } from "./render/defectList.ts";
import { renderLoginPage } from "./render/loginPage.ts";

function root(): HTMLElement {
  const el = document.getElementById("root");
  if (!el) throw new Error("Missing #root element.");
  return el;
}

function wireLogout(): void {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    window.location.href = "/login";
  });
}

function wireNav(): void {
  document.querySelectorAll<HTMLElement>(".app-nav-item[data-nav]").forEach((el) => {
    el.addEventListener("click", () => {
      const nav = el.dataset.nav;
      if (nav === "dashboard" || nav === "defects") window.location.href = "/defects";
      if (nav === "create") window.location.href = "/defects/new";
    });
  });
}

async function renderLoginRoute(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");

  function draw(error?: string): void {
    root().innerHTML = renderLoginPage({ redirectedFromCreateDefect: Boolean(returnTo), error });
    document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = (document.getElementById("fEmail") as HTMLInputElement).value;
      const password = (document.getElementById("fPassword") as HTMLInputElement).value;
      const result = await login(email, password);
      if (result.ok) {
        window.location.href = resolvePostLoginDestination(returnTo);
      } else {
        draw(result.error);
      }
    });
  }

  draw();
}

async function renderCreateDefectRoute(): Promise<void> {
  const me = await fetchMe();
  const guard = guardCreateDefectRoute({ isAuthenticated: Boolean(me), role: me?.role });

  if (guard.type === "redirect-login") {
    window.location.href = buildLoginRedirectUrl("/defects/new");
    return;
  }

  if (guard.type === "access-denied") {
    root().innerHTML = renderShell({
      active: [],
      user: { name: me!.name, role: me!.role },
      createDisabled: true,
      main: renderAccessDenied(),
    });
    document.getElementById("backToDashboardBtn")?.addEventListener("click", () => {
      window.location.href = "/defects";
    });
    wireLogout();
    wireNav();
    return;
  }

  const testers: TesterOption[] = await fetchActiveTesters();
  const values: DefectFormValues = { title: "", severity: "", tester: "", component: "", steps: "" };
  let errors: DefectFormErrors = {};

  function drawForm(showSummary: boolean): void {
    const main = `
      <h1>Create Defect</h1>
      <p class="field-hint" style="margin-bottom: var(--space-4);">
        Log the minimum information triage and the dashboard need. Fields marked
        <span class="required-mark">*</span> are required.
      </p>
      ${renderCreateDefectForm(values, errors, testers, { showSummary })}
    `;
    root().innerHTML = renderShell({ active: ["create"], user: { name: me!.name, role: me!.role }, main });
    wireLogout();
    wireNav();
    wireForm();
  }

  function wireForm(): void {
    const titleInput = document.getElementById("fTitle") as HTMLInputElement;
    const stepsInput = document.getElementById("fSteps") as HTMLTextAreaElement;
    const counterTitle = document.getElementById("counterTitle") as HTMLElement;
    const counterSteps = document.getElementById("counterSteps") as HTMLElement;

    titleInput.addEventListener("input", () => {
      const len = titleInput.value.length;
      counterTitle.textContent = `${len} / 100`;
      counterTitle.classList.toggle("over-limit", len > 100);
    });

    stepsInput.addEventListener("input", () => {
      const len = stepsInput.value.length;
      counterSteps.textContent = `${len} / 2000`;
      counterSteps.classList.toggle("over-limit", len > 2000);
    });

    document.getElementById("cancelBtn")?.addEventListener("click", () => {
      values.title = "";
      values.severity = "";
      values.tester = "";
      values.component = "";
      values.steps = "";
      errors = {};
      drawForm(false);
    });

    document.getElementById("createDefectForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      values.title = titleInput.value;
      values.severity = (document.getElementById("fSeverity") as HTMLSelectElement).value;
      values.tester = (document.getElementById("fTester") as HTMLSelectElement).value;
      values.component = (document.getElementById("fComponent") as HTMLSelectElement).value;
      values.steps = stepsInput.value;

      const result = validateDefectInput(values);
      if (!result.valid) {
        errors = result.errors;
        drawForm(true);
        return;
      }

      const submitResult = await submitDefect(values);
      if (!submitResult.ok) {
        errors = submitResult.errors;
        drawForm(true);
        return;
      }

      drawConfirmation(submitResult.defect);
    });
  }

  function drawConfirmation(defect: { id: string; title: string; severity: string; component: string; tester: string; status: string }): void {
    const main = renderConfirmation(defect);
    root().innerHTML = renderShell({ active: [], user: { name: me!.name, role: me!.role }, main });
    wireLogout();
    wireNav();
    document.getElementById("viewDefectListBtn")?.addEventListener("click", () => {
      window.location.href = "/defects";
    });
    document.getElementById("createAnotherBtn")?.addEventListener("click", () => {
      values.title = "";
      values.severity = "";
      values.tester = "";
      values.component = "";
      values.steps = "";
      errors = {};
      drawForm(false);
    });
  }

  drawForm(false);
}

async function renderDefectListRoute(): Promise<void> {
  const me = await fetchMe();
  if (!me) {
    window.location.href = buildLoginRedirectUrl("/defects");
    return;
  }

  const defects = await fetchDefects();
  const main = renderDefectList(defects);
  root().innerHTML = renderShell({
    active: ["dashboard", "defects"],
    user: { name: me.name, role: me.role },
    createDisabled: me.role !== "Tester",
    main,
  });
  wireLogout();
  wireNav();
  document.getElementById("createDefectLinkBtn")?.addEventListener("click", () => {
    window.location.href = "/defects/new";
  });
}

async function main(): Promise<void> {
  const path = window.location.pathname;
  if (path === "/login") {
    await renderLoginRoute();
  } else if (path === "/defects/new") {
    await renderCreateDefectRoute();
  } else if (path === "/defects") {
    await renderDefectListRoute();
  } else {
    window.location.replace("/defects");
  }
}

main();
