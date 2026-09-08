'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, loginAs } = require('./testServer');

test('AC4: a manager can reach the dashboard summary API', async () => {
  const server = await startTestServer([]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const res = await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
  } finally {
    await server.close();
  }
});

test('AC4: a tester is denied access to the dashboard summary API', async () => {
  const server = await startTestServer([]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Tester');
    const res = await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.ok(body.error && body.error.length > 0);
  } finally {
    await server.close();
  }
});

test('AC4: a developer is denied access to the dashboard summary API', async () => {
  const server = await startTestServer([]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Developer');
    const res = await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 403);
  } finally {
    await server.close();
  }
});

test('AC4: an unauthenticated request is denied access', async () => {
  const server = await startTestServer([]);
  try {
    const res = await fetch(`${server.baseUrl}/api/dashboard/summary`);
    assert.equal(res.status, 403);
  } finally {
    await server.close();
  }
});

test('AC4: a tester is denied access to the drill-through defects API', async () => {
  const server = await startTestServer([]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Tester');
    const res = await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 403);
  } finally {
    await server.close();
  }
});
