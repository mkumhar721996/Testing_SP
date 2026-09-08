import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "sid";

const sessions = new Map<string, string>(); // sessionId -> userId

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, userId);
  return sessionId;
}

export function getUserIdForSession(sessionId: string | undefined): string | undefined {
  if (!sessionId) return undefined;
  return sessions.get(sessionId);
}

export function resetSessionsForTests(): void {
  sessions.clear();
}
