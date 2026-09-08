'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./testServer');

test('AC1: the dashboard page markup contains all three panel headings', async () => {
  const server = await startTestServer([]);
  try {
    const html = await (await fetch(`${server.baseUrl}/dashboard`)).text();
    assert.match(html, /Defect trend — last 30 days/);
    assert.match(html, /Severity breakdown/);
    assert.match(html, /Status distribution/);
  } finally {
    await server.close();
  }
});

test('AC5/AC6: the dashboard markup contains no standalone filter controls (component/assignee/date-range)', async () => {
  const server = await startTestServer([]);
  try {
    const html = await (await fetch(`${server.baseUrl}/dashboard`)).text();
    assert.doesNotMatch(html, /component-filter|assignee-filter|date-range|<select/i);
  } finally {
    await server.close();
  }
});

test('AC3: the dashboard markup contains no status-transition or edit inputs, only a read-only modal Close control', async () => {
  const server = await startTestServer([]);
  try {
    const html = await (await fetch(`${server.baseUrl}/dashboard`)).text();
    assert.doesNotMatch(html, /<input/i);
    assert.doesNotMatch(html, /Resolve|Change status|Edit defect/i);
    assert.match(html, /Read-only — no edit or status controls available here\./);
  } finally {
    await server.close();
  }
});

test('AC4: the dashboard markup contains the access-denied copy for non-manager roles', async () => {
  const server = await startTestServer([]);
  try {
    const html = await (await fetch(`${server.baseUrl}/dashboard`)).text();
    assert.match(html, /You don't have access to this page/);
    assert.match(html, /available to <strong>Managers<\/strong> only/);
  } finally {
    await server.close();
  }
});

test('AC11/AC14: the drill-through table header lists ID, Title, Severity, Status, Created, Updated in order', async () => {
  const server = await startTestServer([]);
  try {
    const html = await (await fetch(`${server.baseUrl}/dashboard`)).text();
    const headerKeys = [...html.matchAll(/data-key="(\w+)"/g)].map((m) => m[1]);
    assert.deepEqual(headerKeys, ['id', 'title', 'severity', 'status', 'created', 'updated']);
  } finally {
    await server.close();
  }
});
