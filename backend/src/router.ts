import type { IncomingMessage, ServerResponse } from "node:http";
import type { User } from "./auth/users.ts";

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  method: string;
  pathname: string;
  query: URLSearchParams;
  body: unknown;
  user: User | null;
}

export type Handler = (ctx: RequestContext) => void | Promise<void>;

interface Route {
  method: string;
  pathname: string;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pathname: string, handler: Handler): void {
    this.routes.push({ method, pathname, handler });
  }

  get(pathname: string, handler: Handler): void {
    this.add("GET", pathname, handler);
  }

  post(pathname: string, handler: Handler): void {
    this.add("POST", pathname, handler);
  }

  find(method: string, pathname: string): Handler | undefined {
    return this.routes.find((r) => r.method === method && r.pathname === pathname)?.handler;
  }
}
