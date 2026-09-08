'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, loginAs } = require('./testServer');

test('AC8: a newly inserted defect is reflected the next time the summary is fetched', async () => {
  const server = await startTestServer([
    { id: 'DEF-1', title: 'A', severity: 'Medium', status: 'New', created: new Date(), updated: new Date() },
  ]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const before = await (await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } })).json();
    const beforeCount = before.severity.find((s) => s.severity === 'Medium').count;

    server.store.insert({ id: 'DEF-2', title: 'B', severity: 'Medium', status: 'New', created: new Date(), updated: new Date() });

    const after = await (await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } })).json();
    const afterCount = after.severity.find((s) => s.severity === 'Medium').count;

    assert.equal(afterCount, beforeCount + 1);
  } finally {
    await server.close();
  }
});

test('AC10: with zero defects, the summary still returns explicit zero-valued trend/severity/status entries', async () => {
  const server = await startTestServer([]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const summary = await (await fetch(`${server.baseUrl}/api/dashboard/summary`, { headers: { Cookie: cookie } })).json();

    assert.equal(summary.trend.length, 30);
    assert.ok(summary.trend.every((b) => b.created === 0 && b.closed === 0));
    assert.equal(summary.severity.length, 4);
    assert.ok(summary.severity.every((s) => s.count === 0));
    assert.equal(summary.status.length, 5);
    assert.ok(summary.status.every((s) => s.count === 0));
  } finally {
    await server.close();
  }
});
