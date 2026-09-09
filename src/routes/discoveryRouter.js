const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/requireAuth');

const discoveryHtml = fs.readFileSync(
  path.join(__dirname, '../../views/discovery.html'),
  'utf8'
);

function handleDiscovery(req, res) {
  if (!requireAuth(req, res)) return;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(discoveryHtml);
}

module.exports = { handleDiscovery };
