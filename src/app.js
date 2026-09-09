const fs = require('fs');
const path = require('path');
const url = require('url');

process.loadEnvFile(path.join(__dirname, '../.env'));

const { handleDiscovery } = require('./routes/discoveryRouter');
const { handleGetLogin, handlePostLogin } = require('./routes/authRouter');

const DESIGN_DIR = path.join(__dirname, '../docs/design');
const DESIGN_CONTENT_TYPES = {
  '.css': 'text/css',
};

// Cache design assets in memory at startup (same approach as the
// discoveryHtml/loginTemplate caches below) so serving them never blocks the
// event loop on synchronous file I/O per request.
const DESIGN_ASSET_CACHE = new Map();
for (const fileName of fs.readdirSync(DESIGN_DIR)) {
  const ext = path.extname(fileName);
  if (DESIGN_CONTENT_TYPES[ext]) {
    DESIGN_ASSET_CACHE.set(fileName, fs.readFileSync(path.join(DESIGN_DIR, fileName), 'utf8'));
  }
}

function serveDesignAsset(pathname, res) {
  const fileName = path.basename(pathname);
  const ext = path.extname(fileName);
  const content = DESIGN_ASSET_CACHE.get(fileName);

  if (!DESIGN_CONTENT_TYPES[ext] || content === undefined) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, { 'Content-Type': DESIGN_CONTENT_TYPES[ext] });
  res.end(content);
}

function app(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/login' && req.method === 'GET') {
    return handleGetLogin(req, res, parsed.query);
  }
  if (pathname === '/login' && req.method === 'POST') {
    return handlePostLogin(req, res);
  }
  if (
    (pathname === '/discovery' || pathname.startsWith('/discovery/')) &&
    req.method === 'GET'
  ) {
    return handleDiscovery(req, res);
  }
  if (pathname.startsWith('/design/') && req.method === 'GET') {
    return serveDesignAsset(pathname, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

module.exports = { app };
