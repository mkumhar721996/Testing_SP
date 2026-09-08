export interface PublicUser {
  id: string;
  name: string;
  role: "Tester" | "Developer" | "Manager";
}

export interface ApiDefect {
  id: string;
  title: string;
  severity: string;
  tester: string;
  component: string;
  steps: string;
  status: string;
}

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

function apiBase(): string {
  return window.__API_BASE__ ?? "";
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await apiFetch("/api/auth/me");
  if (res.status !== 200) return null;
  const body = await res.json();
  return body.user;
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (res.status !== 200) return { ok: false, error: body.error ?? "Login failed." };
  return { ok: true, user: body.user };
}

export async function fetchActiveTesters(): Promise<{ name: string }[]> {
  const res = await apiFetch("/api/testers?status=active");
  const body = await res.json();
  return body.testers;
}

export async function fetchDefects(): Promise<ApiDefect[]> {
  const res = await apiFetch("/api/defects");
  const body = await res.json();
  return body.defects;
}

export async function submitDefect(
  input: { title: string; severity: string; tester: string; component: string; steps: string },
): Promise<{ ok: true; defect: ApiDefect } | { ok: false; errors: Record<string, string> }> {
  const res = await apiFetch("/api/defects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (res.status === 201) return { ok: true, defect: body.defect };
  return { ok: false, errors: body.errors ?? {} };
}
