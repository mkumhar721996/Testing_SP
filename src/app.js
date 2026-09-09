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

function serveDesignAsset(pathname, res) {
  const fileName = path.basename(pathname);
  const ext = path.extname(fileName);
  const filePath = path.join(DESIGN_DIR, fileName);

  if (!DESIGN_CONTENT_TYPES[ext] || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, { 'Content-Type': DESIGN_CONTENT_TYPES[ext] });
  res.end(fs.readFileSync(filePath, 'utf8'));
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
