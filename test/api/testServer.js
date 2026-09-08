'use strict';

const http = require('node:http');
const { createApp } = require('../../src/app');
const { createDefectsStore } = require('../../src/db/defectsStore');
const { createSessionStore } = require('../../src/auth/session');

/** Spins up a real app instance on an ephemeral port for API-level tests. */
function startTestServer(initialDefects = []) {
  const store = createDefectsStore(initialDefects);
  const sessions = createSessionStore();
  const server = http.createServer(createApp({ store, sessions }));

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        store,
        sessions,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

/** Logs in as the given role and returns the Cookie header value to reuse on subsequent requests. */
async function loginAs(baseUrl, role) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const setCookie = res.headers.get('set-cookie') || '';
  return setCookie.split(';')[0];
}

module.exports = { startTestServer, loginAs };
