import type { IncomingMessage, ServerResponse } from "node:http";
import { parseCookies, readJsonBody, sendJson } from "./http-helpers.ts";
import { Router } from "./router.ts";
import { findUserById } from "./auth/users.ts";
import { getUserIdForSession, SESSION_COOKIE_NAME } from "./auth/session.ts";
import { loginHandler, meHandler } from "./auth/routes.ts";
import { listTestersHandler } from "./testers/routes.ts";
import { createDefectHandler, listDefectsHandler } from "./defects/routes.ts";

export type RequestListener = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export function createApp(devWebOrigin: string): RequestListener {
  const router = new Router();
  router.get("/health", (ctx) => sendJson(ctx.res, 200, { status: "ok" }));
  router.post("/api/auth/login", loginHandler);
  router.get("/api/auth/me", meHandler);
  router.get("/api/testers", listTestersHandler);
  router.post("/api/defects", createDefectHandler);
  router.get("/api/defects", listDefectsHandler);

  return async function requestListener(req, res) {
    const origin = req.headers.origin;
    if (origin === devWebOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";
    const handler = router.find(method, url.pathname);

    if (!handler) {
      sendJson(res, 404, { error: "Not found." });
      return;
    }

    let body: unknown = {};
    if (method === "POST") {
      try {
        body = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body." });
        return;
      }
    }

    const cookies = parseCookies(req.headers.cookie);
    const userId = getUserIdForSession(cookies[SESSION_COOKIE_NAME]);
    const user = userId ? findUserById(userId) ?? null : null;

    try {
      await handler({
        req,
        res,
        method,
        pathname: url.pathname,
        query: url.searchParams,
        body,
        user,
      });
    } catch (err) {
      sendJson(res, 500, { error: "Internal server error." });
    }
  };
}
