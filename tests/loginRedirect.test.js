const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./testServer');

let server;
let baseUrl;

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(() => stopServer(server));

test('Completing login redirects back to the originally requested discovery screen (AC4)', async () => {
  const originalUrl = '/discovery/restaurants/123';

  const initialAttempt = await fetch(`${baseUrl}${originalUrl}`, {
    redirect: 'manual',
  });
  const loginLocation = initialAttempt.headers.get('location');
  const redirectTo = new URL(loginLocation, baseUrl).searchParams.get(
    'redirectTo'
  );

  assert.equal(redirectTo, originalUrl);

  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=testuser&password=test-password&redirectTo=${encodeURIComponent(
      redirectTo
    )}`,
    redirect: 'manual',
  });

  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.get('location'), originalUrl);
});
