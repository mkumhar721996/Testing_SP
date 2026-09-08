import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedTransitions, canTransition } from './defectStatus.js';

const ROLES = ['developer', 'tester', 'manager'];
const STATUSES = ['open', 'fixed', 'closed', 'reopened'];

test('AC1: developer on an Open defect can only transition to Fixed', () => {
  assert.deepEqual(getAllowedTransitions('developer', 'open'), ['fixed']);
});

test('AC2: developer on a Fixed defect can only transition to Open', () => {
  assert.deepEqual(getAllowedTransitions('developer', 'fixed'), ['open']);
});

test('AC3: tester on a Fixed defect can transition to Closed or Re-opened', () => {
  assert.deepEqual(
    getAllowedTransitions('tester', 'fixed').slice().sort(),
    ['closed', 'reopened'],
  );
});

test('AC4: tester on a Closed defect can only transition to Re-opened', () => {
  assert.deepEqual(getAllowedTransitions('tester', 'closed'), ['reopened']);
});

test('AC5: tester on a Re-opened defect can only transition to Fixed', () => {
  assert.deepEqual(getAllowedTransitions('tester', 'reopened'), ['fixed']);
});

test('AC6: Closed and Re-opened are never offered from Open status, for any role', () => {
  for (const role of ROLES) {
    const allowed = getAllowedTransitions(role, 'open');
    assert.ok(!allowed.includes('closed'));
    assert.ok(!allowed.includes('reopened'));
  }
});

test('AC7: manager has no allowed transitions from any status', () => {
  for (const status of STATUSES) {
    assert.deepEqual(getAllowedTransitions('manager', status), []);
  }
});

test('canTransition mirrors getAllowedTransitions for allowed and disallowed pairs', () => {
  assert.equal(canTransition('developer', 'open', 'fixed'), true);
  assert.equal(canTransition('tester', 'open', 'fixed'), false);
  assert.equal(canTransition('developer', 'fixed', 'closed'), false);
  assert.equal(canTransition('manager', 'fixed', 'closed'), false);
  assert.equal(canTransition('manager', 'fixed', 'reopened'), false);
});
