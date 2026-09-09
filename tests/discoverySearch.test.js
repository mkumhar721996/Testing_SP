const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./testServer');

let server;
let baseUrl;

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(() => stopServer(server));

async function loginAndGetCookie(baseUrl) {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=testuser&password=test-password&redirectTo=%2Fdiscovery',
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie');
  return setCookie.split(';')[0];
}

test('GET /discovery with a valid session displays the search interface (AC3)', async () => {
  const cookie = await loginAndGetCookie(baseUrl);

  const res = await fetch(`${baseUrl}/discovery`, {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.match(body, /id="search-interface"/);
});
