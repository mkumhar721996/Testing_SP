export type Role = "Tester" | "Developer" | "Manager";

export interface AuthState {
  isAuthenticated: boolean;
  role?: Role;
}

export type GuardResult =
  | { type: "redirect-login" }
  | { type: "access-denied" }
  | { type: "allow" };

export function guardCreateDefectRoute(auth: AuthState): GuardResult {
  if (!auth.isAuthenticated) return { type: "redirect-login" };
  if (auth.role !== "Tester") return { type: "access-denied" };
  return { type: "allow" };
}

export function buildLoginRedirectUrl(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function resolvePostLoginDestination(returnTo: string | null): string {
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return "/defects";
}
