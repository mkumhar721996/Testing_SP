'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRole } = require('../../src/auth/requireRole');

test('requireRole: authorizes only the exact required role', () => {
  const isManager = requireRole('Manager');
  assert.equal(isManager('Manager'), true);
  assert.equal(isManager('Tester'), false);
  assert.equal(isManager('Developer'), false);
  assert.equal(isManager(undefined), false);
});
