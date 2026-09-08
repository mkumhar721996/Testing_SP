export interface LoginPageOptions {
  redirectedFromCreateDefect: boolean;
  error?: string;
}

export function renderLoginPage(options: LoginPageOptions): string {
  const banner = options.redirectedFromCreateDefect
    ? `<div class="alert alert-info">
        You were redirected from <strong>Create Defect</strong>. Signing in will return you
        there automatically.
      </div>`
    : "";

  const errorAlert = options.error
    ? `<div class="alert alert-danger" id="loginError">${options.error}</div>`
    : "";

  return `
<div class="center-page">
  <div class="card center-card">
    <div class="card-body">
      <h2>Sign in</h2>
      ${banner}
      ${errorAlert}
      <form id="loginForm" novalidate>
        <div class="form-group">
          <label class="label" for="fEmail">Email</label>
          <input class="input" type="email" id="fEmail" placeholder="you@company.com" />
        </div>
        <div class="form-group">
          <label class="label" for="fPassword">Password</label>
          <input class="input" type="password" id="fPassword" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
        </div>
        <button type="submit" class="btn btn-primary" id="loginSubmitBtn">Sign in</button>
      </form>
    </div>
  </div>
</div>
`.trim();
}
