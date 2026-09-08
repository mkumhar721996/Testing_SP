import type { RequestContext } from "../router.ts";
import { sendJson } from "../http-helpers.ts";
import { validateDefectInput } from "./validation.ts";
import { addDefect, listDefects } from "./repository.ts";
import type { DefectInput } from "./model.ts";

export function createDefectHandler(ctx: RequestContext): void {
  if (!ctx.user) {
    sendJson(ctx.res, 401, { error: "Authentication required." });
    return;
  }
  if (ctx.user.role !== "Tester") {
    sendJson(ctx.res, 403, { error: "Only testers can create defects." });
    return;
  }

  const input = (ctx.body ?? {}) as Partial<DefectInput>;
  const { valid, errors } = validateDefectInput(input);
  if (!valid) {
    sendJson(ctx.res, 422, { errors });
    return;
  }

  const defect = addDefect(input as DefectInput);
  sendJson(ctx.res, 201, { defect });
}

export function listDefectsHandler(ctx: RequestContext): void {
  if (!ctx.user) {
    sendJson(ctx.res, 401, { error: "Authentication required." });
    return;
  }
  sendJson(ctx.res, 200, { defects: listDefects() });
}
