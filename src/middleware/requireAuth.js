const { parseCookies } = require('../cookies');
const { SESSION_COOKIE_NAME, getSession } = require('../session');

/**
 * Guards a handler behind an authenticated session. If there is no valid
 * session, redirects to /login with the originally requested URL preserved
 * as redirectTo and returns false without invoking the handler. Returns
 * true (and calls req/res through) when a session is present.
 */
function requireAuth(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const session = getSession(cookies[SESSION_COOKIE_NAME]);

  if (session && session.username) {
    return true;
  }

  const redirectTo = encodeURIComponent(req.url);
  res.writeHead(302, { Location: `/login?redirectTo=${redirectTo}` });
  res.end();
  return false;
}

module.exports = { requireAuth };
