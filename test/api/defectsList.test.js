'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, loginAs } = require('./testServer');

function makeDefect(overrides) {
  return {
    id: 'DEF-1',
    title: 'Sample',
    severity: 'Medium',
    status: 'New',
    created: new Date(2026, 0, 1),
    updated: new Date(2026, 0, 1),
    component: 'Checkout',
    reportedBy: 'A. Chen',
    ...overrides,
  };
}

test('AC2: GET /api/defects filters by a severity chart selection', async () => {
  const server = await startTestServer([
    makeDefect({ id: 'DEF-1', severity: 'Medium' }),
    makeDefect({ id: 'DEF-2', severity: 'High' }),
  ]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const res = await fetch(`${server.baseUrl}/api/defects?selectionType=severity&selectionValue=Medium`, { headers: { Cookie: cookie } });
    const body = await res.json();
    assert.deepEqual(body.rows.map((r) => r.id), ['DEF-1']);
  } finally {
    await server.close();
  }
});

test('AC11: default sort is created date descending', async () => {
  const server = await startTestServer([
    makeDefect({ id: 'DEF-old', status: 'New', created: new Date(2026, 0, 1) }),
    makeDefect({ id: 'DEF-new', status: 'New', created: new Date(2026, 0, 10) }),
  ]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const res = await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New`, { headers: { Cookie: cookie } });
    const body = await res.json();
    assert.deepEqual(body.rows.map((r) => r.id), ['DEF-new', 'DEF-old']);
  } finally {
    await server.close();
  }
});

test('AC12: clicking a column re-sorts by that column, and direction can be reversed', async () => {
  const server = await startTestServer([
    makeDefect({ id: 'DEF-1', status: 'New', title: 'Zebra bug' }),
    makeDefect({ id: 'DEF-2', status: 'New', title: 'Apple bug' }),
  ]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const asc = await (await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New&sortKey=title&sortDir=asc`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(asc.rows.map((r) => r.id), ['DEF-2', 'DEF-1']);

    const desc = await (await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New&sortKey=title&sortDir=desc`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(desc.rows.map((r) => r.id), ['DEF-1', 'DEF-2']);
  } finally {
    await server.close();
  }
});

test('AC13: exactly 26 matching defects gives 25 rows on page 1 and 1 on page 2', async () => {
  const defects = Array.from({ length: 26 }, (_, i) =>
    makeDefect({ id: 'DEF-' + i, status: 'New', created: new Date(2026, 0, 1 + i) }));
  const server = await startTestServer(defects);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const page1 = await (await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New&page=1`, { headers: { Cookie: cookie } })).json();
    const page2 = await (await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New&page=2`, { headers: { Cookie: cookie } })).json();

    assert.equal(page1.rows.length, 25);
    assert.equal(page1.total, 26);
    assert.equal(page1.totalPages, 2);
    assert.equal(page2.rows.length, 1);
  } finally {
    await server.close();
  }
});

test('AC14: each returned row exposes id, title, severity, status, created, updated', async () => {
  const server = await startTestServer([makeDefect({ id: 'DEF-1' })]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const body = await (await fetch(`${server.baseUrl}/api/defects?selectionType=status&selectionValue=New`, { headers: { Cookie: cookie } })).json();
    const row = body.rows[0];
    assert.ok('id' in row && 'title' in row && 'severity' in row && 'status' in row && 'created' in row && 'updated' in row);
  } finally {
    await server.close();
  }
});

test('AC10: a selection with zero matches returns an empty rows array, not an error', async () => {
  const server = await startTestServer([makeDefect({ id: 'DEF-1', severity: 'Medium' })]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const body = await (await fetch(`${server.baseUrl}/api/defects?selectionType=severity&selectionValue=Low`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(body.rows, []);
    assert.equal(body.total, 0);
  } finally {
    await server.close();
  }
});

test('AC3: no PATCH/PUT/DELETE endpoint exists for defects (structurally read-only)', async () => {
  const server = await startTestServer([makeDefect({ id: 'DEF-1' })]);
  try {
    const cookie = await loginAs(server.baseUrl, 'Manager');
    const patch = await fetch(`${server.baseUrl}/api/defects/DEF-1`, { method: 'PATCH', headers: { Cookie: cookie } });
    const put = await fetch(`${server.baseUrl}/api/defects/DEF-1`, { method: 'PUT', headers: { Cookie: cookie } });
    const del = await fetch(`${server.baseUrl}/api/defects/DEF-1`, { method: 'DELETE', headers: { Cookie: cookie } });
    assert.equal(patch.status, 404);
    assert.equal(put.status, 404);
    assert.equal(del.status, 404);
  } finally {
    await server.close();
  }
});
