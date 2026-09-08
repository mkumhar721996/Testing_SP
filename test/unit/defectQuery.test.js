'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { queryDefects } = require('../../src/services/defectQuery');

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

test('AC2: selection type severity filters to matching defects only', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', severity: 'Medium' }),
    makeDefect({ id: 'DEF-2', severity: 'High' }),
  ];
  const result = queryDefects(defects, { selection: { type: 'severity', value: 'Medium' } });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-1']);
});

test('AC2: selection type status filters to matching defects only', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', status: 'Closed' }),
    makeDefect({ id: 'DEF-2', status: 'New' }),
  ];
  const result = queryDefects(defects, { selection: { type: 'status', value: 'Closed' } });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-1']);
});

test('AC2: selection type createdOnDay filters to defects created that exact day', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', created: new Date(2026, 0, 5) }),
    makeDefect({ id: 'DEF-2', created: new Date(2026, 0, 6) }),
  ];
  const result = queryDefects(defects, { selection: { type: 'createdOnDay', value: '2026-1-5' } });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-1']);
});

test('AC2: selection type closedOnDay filters to Closed defects updated that exact day', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', status: 'Closed', updated: new Date(2026, 0, 5) }),
    makeDefect({ id: 'DEF-2', status: 'New', updated: new Date(2026, 0, 5) }),
  ];
  const result = queryDefects(defects, { selection: { type: 'closedOnDay', value: '2026-1-5' } });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-1']);
});

test('AC11: default sort is by created date descending', () => {
  const defects = [
    makeDefect({ id: 'DEF-old', created: new Date(2026, 0, 1) }),
    makeDefect({ id: 'DEF-new', created: new Date(2026, 0, 10) }),
  ];
  const result = queryDefects(defects, { selection: { type: 'status', value: 'New' } });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-new', 'DEF-old']);
});

test('AC12: sorting by title ascending reorders rows alphabetically', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', title: 'Zebra bug' }),
    makeDefect({ id: 'DEF-2', title: 'Apple bug' }),
  ];
  const result = queryDefects(defects, {
    selection: { type: 'status', value: 'New' },
    sortKey: 'title',
    sortDir: 'asc',
  });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-2', 'DEF-1']);
});

test('AC12: sorting by title descending reverses the order', () => {
  const defects = [
    makeDefect({ id: 'DEF-1', title: 'Zebra bug' }),
    makeDefect({ id: 'DEF-2', title: 'Apple bug' }),
  ];
  const result = queryDefects(defects, {
    selection: { type: 'status', value: 'New' },
    sortKey: 'title',
    sortDir: 'desc',
  });
  assert.deepEqual(result.rows.map((r) => r.id), ['DEF-1', 'DEF-2']);
});

test('AC13: exactly 26 matching defects yields 25 rows on page 1 and 1 row on page 2', () => {
  const defects = Array.from({ length: 26 }, (_, i) =>
    makeDefect({ id: 'DEF-' + i, created: new Date(2026, 0, 1 + i) }));
  const page1 = queryDefects(defects, { selection: { type: 'status', value: 'New' }, page: 1 });
  const page2 = queryDefects(defects, { selection: { type: 'status', value: 'New' }, page: 2 });
  assert.equal(page1.rows.length, 25);
  assert.equal(page1.total, 26);
  assert.equal(page1.totalPages, 2);
  assert.equal(page2.rows.length, 1);
});

test('AC14: each row exposes id, title, severity, status, created, updated', () => {
  const defects = [makeDefect({ id: 'DEF-1' })];
  const result = queryDefects(defects, { selection: { type: 'status', value: 'New' } });
  const row = result.rows[0];
  assert.ok('id' in row && 'title' in row && 'severity' in row && 'status' in row);
  assert.ok('created' in row && 'updated' in row);
});

test('AC10: an empty matching set returns zero rows with total 0', () => {
  const result = queryDefects([], { selection: { type: 'severity', value: 'Low' } });
  assert.deepEqual(result.rows, []);
  assert.equal(result.total, 0);
  assert.equal(result.totalPages, 1);
});
