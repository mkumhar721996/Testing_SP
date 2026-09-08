import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
process.loadEnvFile(path.join(repoRoot, ".env"));

const port = Number(process.env.ARC_WEB_PORT ?? 3001);
const devPort = process.env.ARC_DEV_PORT ?? 8001;
const apiBase = `http://localhost:${devPort}`;

const SPA_ROUTES = new Set(["/", "/login", "/defects", "/defects/new"]);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function serveIndexHtml(): Promise<{ body: string; contentType: string }> {
  const html = await readFile(path.join(__dirname, "public", "index.html"), "utf8");
  return { body: html.replace("__API_BASE__", apiBase), contentType: CONTENT_TYPES[".html"] };
}

async function serveStaticFile(filePath: string): Promise<{ body: string | Buffer; contentType: string } | null> {
  let raw: Buffer;
  try {
    raw = await readFile(filePath);
  } catch {
    return null;
  }
  const ext = path.extname(filePath);
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  if (ext === ".ts") {
    const stripped = stripTypeScriptTypes(raw.toString("utf8"), { mode: "strip" });
    return { body: stripped, contentType };
  }
  return { body: raw, contentType };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  if (SPA_ROUTES.has(pathname)) {
    const { body, contentType } = await serveIndexHtml();
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.end(body);
    return;
  }

  if (pathname.startsWith("/design/")) {
    const filePath = path.join(repoRoot, "docs", "design", pathname.replace("/design/", ""));
    const file = await serveStaticFile(filePath);
    if (!file) {
      res.statusCode = 404;
      res.end("Not found.");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", file.contentType);
    res.end(file.body);
    return;
  }

  if (pathname.startsWith("/src/")) {
    const filePath = path.join(__dirname, pathname);
    const file = await serveStaticFile(filePath);
    if (!file) {
      res.statusCode = 404;
      res.end("Not found.");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", file.contentType);
    res.end(file.body);
    return;
  }

  res.statusCode = 404;
  res.end("Not found.");
});

server.listen(port, () => {
  console.log(`Frontend listening on http://localhost:${port}`);
});
