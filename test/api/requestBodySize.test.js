'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./testServer');

test('security: POST /api/auth/login rejects an oversized request body instead of buffering it unbounded', async () => {
  const server = await startTestServer([]);
  try {
    // Well over any legitimate {"role":"Manager"} payload; simulates a DoS attempt.
    const oversizedRole = 'x'.repeat(50 * 1024);
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: oversizedRole }),
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.ok(body.error && body.error.length > 0);
  } finally {
    await server.close();
  }
});

test('security: a normal-sized login payload is still accepted', async () => {
  const server = await startTestServer([]);
  try {
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'Manager' }),
    });
    assert.equal(res.status, 200);
  } finally {
    await server.close();
  }
});
