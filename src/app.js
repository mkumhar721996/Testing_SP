'use strict';

const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { buildDashboardSummary } = require('./services/dashboardAggregation');
const { queryDefects } = require('./services/defectQuery');
const { VALID_ROLES } = require('./auth/session');
const { requireRole } = require('./auth/requireRole');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DESIGN_DIR = path.join(__dirname, '..', 'docs', 'design');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const isManager = requireRole('Manager');

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

const MAX_JSON_BODY_BYTES = 10 * 1024; // 10KB — generous for any {role} style payload this app accepts

function readJsonBody(req, maxBytes = MAX_JSON_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    let rejected = false;

    req.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > maxBytes) {
        rejected = true;
        data = ''; // drop what we've buffered so far; further chunks are ignored below
        const err = new Error('Request body too large');
        err.statusCode = 413;
        reject(err);
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (rejected) return;
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => {
      if (!rejected) reject(err);
    });
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function serializeDefect(d) {
  return { ...d, created: d.created.toISOString(), updated: d.updated.toISOString() };
}

/** Resolves a request pathname to a file inside baseDir, refusing traversal outside it. */
function resolveStaticPath(baseDir, relativePathname) {
  const resolved = path.resolve(baseDir, '.' + relativePathname);
  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) return null;
  return resolved;
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function createApp({ store, sessions }) {
  return async function handleRequest(req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;
    const cookies = parseCookies(req);
    const role = sessions.getRole(cookies.sid);

    try {
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await readJsonBody(req);
        if (!VALID_ROLES.includes(body.role)) {
          sendJson(res, 400, { error: 'Invalid role' });
          return;
        }
        const token = sessions.create(body.role);
        res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; Path=/; SameSite=Lax`);
        sendJson(res, 200, { role: body.role });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/dashboard/summary') {
        if (!isManager(role)) {
          sendJson(res, 403, { error: 'The Defect Dashboard is available to Managers only.' });
          return;
        }
        const summary = buildDashboardSummary(store.list(), new Date());
        sendJson(res, 200, summary);
        return;
      }

      if (req.method === 'GET' && pathname === '/api/defects') {
        if (!isManager(role)) {
          sendJson(res, 403, { error: 'The Defect Dashboard is available to Managers only.' });
          return;
        }
        const q = parsed.query;
        const selection = q.selectionType ? { type: q.selectionType, value: q.selectionValue } : undefined;
        const result = queryDefects(store.list(), {
          selection,
          sortKey: q.sortKey,
          sortDir: q.sortDir,
          page: q.page ? parseInt(q.page, 10) : 1,
        });
        sendJson(res, 200, { ...result, rows: result.rows.map(serializeDefect) });
        return;
      }

      if (req.method === 'GET' && (pathname === '/' || pathname === '/dashboard')) {
        serveStatic(res, path.join(PUBLIC_DIR, 'dashboard.html'));
        return;
      }

      if (req.method === 'GET' && pathname.startsWith('/design/')) {
        const staticPath = resolveStaticPath(DESIGN_DIR, pathname.slice('/design'.length));
        if (staticPath && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
          serveStatic(res, staticPath);
          return;
        }
      }

      if (req.method === 'GET') {
        const staticPath = resolveStaticPath(PUBLIC_DIR, pathname);
        if (staticPath && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
          serveStatic(res, staticPath);
          return;
        }
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      if (err && err.statusCode === 413) {
        sendJson(res, 413, { error: 'Request body too large' });
        return;
      }
      sendJson(res, 500, { error: 'Internal error' });
    }
  };
}

module.exports = { createApp };
