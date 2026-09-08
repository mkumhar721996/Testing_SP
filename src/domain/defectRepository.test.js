import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefectRepository } from './defectRepository.js';

function makeRepo() {
  return createDefectRepository([
    {
      id: 'DEF-1042',
      status: 'open',
      statusHistory: [{ actor: 'Alicia Gomez', from: null, to: 'open', timestamp: '2026-09-02T00:00:00.000Z' }],
    },
  ]);
}

test('AC8: after a transition, the defect record reflects the new status', () => {
  const repo = makeRepo();
  const updated = repo.updateStatus('DEF-1042', 'Priya Patel', 'fixed');
  assert.equal(updated.status, 'fixed');
  assert.equal(repo.getById('DEF-1042').status, 'fixed');
});

test('AC9: after a transition, the previous status is no longer the current status', () => {
  const repo = makeRepo();
  const before = repo.getById('DEF-1042');
  assert.equal(before.status, 'open');
  repo.updateStatus('DEF-1042', 'Priya Patel', 'fixed');
  const after = repo.getById('DEF-1042');
  assert.notEqual(after.status, 'open');
});

test('updateStatus appends an append-only history entry with actor, from, to and a timestamp', () => {
  const repo = makeRepo();
  const before = repo.getById('DEF-1042');
  assert.equal(before.statusHistory.length, 1);
  repo.updateStatus('DEF-1042', 'Priya Patel', 'fixed');
  const after = repo.getById('DEF-1042');
  assert.equal(after.statusHistory.length, 2);
  const entry = after.statusHistory[1];
  assert.equal(entry.actor, 'Priya Patel');
  assert.equal(entry.from, 'open');
  assert.equal(entry.to, 'fixed');
  assert.ok(entry.timestamp);
});

test('getById returns a defensive copy so callers cannot mutate stored state directly', () => {
  const repo = makeRepo();
  const defect = repo.getById('DEF-1042');
  defect.status = 'closed';
  assert.equal(repo.getById('DEF-1042').status, 'open');
});
