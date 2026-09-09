const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./testServer');

let server;
let baseUrl;

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(() => stopServer(server));

test('GET /discovery without a session redirects to /login (AC1)', async () => {
  const res = await fetch(`${baseUrl}/discovery`, { redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login?redirectTo=%2Fdiscovery');
});

test('GET /discovery/restaurants/123 without a session redirects to /login for any discovery screen (AC1)', async () => {
  const res = await fetch(`${baseUrl}/discovery/restaurants/123`, {
    redirect: 'manual',
  });

  assert.equal(res.status, 302);
  assert.equal(
    res.headers.get('location'),
    '/login?redirectTo=%2Fdiscovery%2Frestaurants%2F123'
  );
});

test('GET /discovery without a session never renders discovery content (AC2)', async () => {
  const res = await fetch(`${baseUrl}/discovery`, { redirect: 'manual' });
  const body = await res.text();

  assert.equal(res.status, 302);
  assert.doesNotMatch(body, /id="search-interface"/);
});
