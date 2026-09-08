import type { RequestContext } from "../router.ts";
import { sendJson } from "../http-helpers.ts";
import { getTesters } from "./repository.ts";

export function listTestersHandler(ctx: RequestContext): void {
  if (!ctx.user) {
    sendJson(ctx.res, 401, { error: "Authentication required." });
    return;
  }
  const status = ctx.query.get("status") ?? undefined;
  sendJson(ctx.res, 200, { testers: getTesters(status) });
}
