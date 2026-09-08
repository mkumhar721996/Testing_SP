'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDefectsStore } = require('../../src/db/defectsStore');

test('defectsStore: list returns a copy of seeded records', () => {
  const store = createDefectsStore([{ id: 'DEF-1', title: 'A', severity: 'Low', status: 'New' }]);
  const rows = store.list();
  assert.equal(rows.length, 1);
  rows[0].title = 'mutated';
  assert.equal(store.get('DEF-1').title, 'A');
});

test('defectsStore: insert adds a new defect retrievable by get', () => {
  const store = createDefectsStore([]);
  store.insert({ id: 'DEF-2', title: 'B', severity: 'High', status: 'New' });
  assert.equal(store.get('DEF-2').title, 'B');
  assert.equal(store.list().length, 1);
});

test('defectsStore: update merges a patch onto an existing defect', () => {
  const store = createDefectsStore([{ id: 'DEF-3', title: 'C', severity: 'Medium', status: 'New' }]);
  const updated = store.update('DEF-3', { status: 'Closed' });
  assert.equal(updated.status, 'Closed');
  assert.equal(store.get('DEF-3').status, 'Closed');
});

test('defectsStore: update on a missing id returns undefined', () => {
  const store = createDefectsStore([]);
  assert.equal(store.update('missing', { status: 'Closed' }), undefined);
});
