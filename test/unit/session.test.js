'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionStore } = require('../../src/auth/session');

test('session: create issues a token that resolves back to the given role', () => {
  const sessions = createSessionStore();
  const token = sessions.create('Manager');
  assert.equal(sessions.getRole(token), 'Manager');
});

test('session: an unknown token resolves to undefined', () => {
  const sessions = createSessionStore();
  assert.equal(sessions.getRole('nonexistent-token'), undefined);
});

test('session: two created tokens are distinct', () => {
  const sessions = createSessionStore();
  const a = sessions.create('Manager');
  const b = sessions.create('Manager');
  assert.notEqual(a, b);
});
