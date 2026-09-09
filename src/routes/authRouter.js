const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { SESSION_COOKIE_NAME, createSession } = require('../session');
const { validateCredentials } = require('../users');

const DEFAULT_REDIRECT = '/discovery';

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

const loginTemplate = fs.readFileSync(
  path.join(__dirname, '../../views/login.html'),
  'utf8'
);

function renderLogin(redirectTo, hasError) {
  return loginTemplate
    .replace('{{redirectTo}}', encodeURIComponent(redirectTo))
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
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    const form = querystring.parse(body);
    const redirectTo = sanitizeRedirectTarget(form.redirectTo);

    if (validateCredentials(form.username, form.password)) {
      const sessionId = createSession({ username: form.username });
      res.writeHead(302, {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/`,
        Location: redirectTo,
      });
      res.end();
      return;
    }

    res.writeHead(401, { 'Content-Type': 'text/html' });
    res.end(renderLogin(redirectTo, true));
  });
}

module.exports = { handleGetLogin, handlePostLogin };
