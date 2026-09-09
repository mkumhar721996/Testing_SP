const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { SESSION_COOKIE_NAME, createSession } = require('../session');
const { validateCredentials } = require('../users');
const { log, getRequestId } = require('../logger');

const DEFAULT_REDIRECT = '/discovery';
const MAX_BODY_SIZE = 1024 * 10; // 10KB

// Only allow same-site, single-path redirects (must start with exactly one
// '/'); rejects absolute URLs and protocol-relative ("//host") targets that
// would otherwise let an attacker-controlled redirectTo send a user off-site
// after login.
function sanitizeRedirectTarget(candidate) {
  if (typeof candidate === 'string' && /^\/(?!\/)/.test(candidate)) {
    return candidate;
  }
  return DEFAULT_REDIRECT;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const loginTemplate = fs.readFileSync(
  path.join(__dirname, '../../views/login.html'),
  'utf8'
);

function renderLogin(redirectTo, hasError) {
  return loginTemplate
    .replace('{{redirectTo}}', htmlEscape(redirectTo))
    .replace(
      '{{error}}',
      hasError ? '<p class="field-error">Invalid username or password.</p>' : ''
    );
}

function handleGetLogin(req, res, query) {
  const redirectTo = sanitizeRedirectTarget(query.redirectTo);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(renderLogin(redirectTo, false));
}

function handlePostLogin(req, res) {
  const requestId = getRequestId(req);
  let body = '';
  let overLimit = false;

  req.on('data', (chunk) => {
    if (overLimit) return;
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      overLimit = true;
      req.socket.destroy();
    }
  });

  req.on('end', () => {
    if (overLimit) return;

    const form = querystring.parse(body);
    const redirectTo = sanitizeRedirectTarget(form.redirectTo);

    if (validateCredentials(form.username, form.password)) {
      const sessionId = createSession({ username: form.username, loginRequestId: requestId });
      log('info', 'auth.login.success', { requestId, username: form.username });
      res.writeHead(302, {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/`,
        Location: redirectTo,
      });
      res.end();
      return;
    }

    log('warn', 'auth.login.failure', {
      requestId,
      username: form.username,
      reason: 'invalid_credentials',
    });
    res.writeHead(401, { 'Content-Type': 'text/html' });
    res.end(renderLogin(redirectTo, true));
  });
}

module.exports = { handleGetLogin, handlePostLogin };
