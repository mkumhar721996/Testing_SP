const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./testServer');

let server;
let baseUrl;

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(() => stopServer(server));

function extractRedirectToFieldValue(html) {
  const match = html.match(/name="redirectTo" value="([^"]*)"/);
  return match ? match[1] : null;
}

// Reverses the HTML-escaping applied by the server so this test holds the
// same string a browser's DOM would expose via input.value, before that
// value gets application/x-www-form-urlencoded-encoded for submission.
function htmlUnescape(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

test('Completing login redirects back to the originally requested discovery screen (AC4)', async () => {
  const originalUrl = '/discovery/restaurants/123';

  const initialAttempt = await fetch(`${baseUrl}${originalUrl}`, {
    redirect: 'manual',
  });
  const loginLocation = initialAttempt.headers.get('location');

  // Render the actual login page (as a browser would after following the
  // redirect) and read the redirectTo value out of its hidden input, rather
  // than reconstructing it ourselves, so this test exercises the real
  // render -> browser form-submit -> parse round trip.
  const loginPageRes = await fetch(`${baseUrl}${loginLocation}`);
  const loginHtml = await loginPageRes.text();
  const hiddenFieldValue = htmlUnescape(extractRedirectToFieldValue(loginHtml));

  assert.equal(hiddenFieldValue, originalUrl);

  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=testuser&password=test-password&redirectTo=${encodeURIComponent(
      hiddenFieldValue
    )}`,
    redirect: 'manual',
  });

  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.get('location'), originalUrl);
});

test('Login rejects an off-site redirectTo and falls back to discovery', async () => {
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=testuser&password=test-password&redirectTo=${encodeURIComponent(
      '//evil.example.com/phish'
    )}`,
    redirect: 'manual',
  });

  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.get('location'), '/discovery');
});
