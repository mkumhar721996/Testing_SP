import type { RequestContext } from "../router.ts";
import { sendJson } from "../http-helpers.ts";
import { findUserByCredentials, toPublicUser } from "./users.ts";
import { createSession, SESSION_COOKIE_NAME } from "./session.ts";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export function loginHandler(ctx: RequestContext): void {
  const body = ctx.body as LoginBody;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const user = findUserByCredentials(email, password);

  if (!user) {
    sendJson(ctx.res, 401, { error: "Invalid email or password." });
    return;
  }

  const sessionId = createSession(user.id);
  ctx.res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
  );
  sendJson(ctx.res, 200, { user: toPublicUser(user) });
}

export function meHandler(ctx: RequestContext): void {
  if (!ctx.user) {
    sendJson(ctx.res, 401, { error: "Not authenticated." });
    return;
  }
  sendJson(ctx.res, 200, { user: toPublicUser(ctx.user) });
}
