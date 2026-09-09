const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'sessionId';

const sessions = new Map();

function createSession(data) {
  const id = crypto.randomUUID();
  sessions.set(id, data);
  return id;
}

function getSession(id) {
  return id ? sessions.get(id) : undefined;
}

function destroySession(id) {
  sessions.delete(id);
}

module.exports = { SESSION_COOKIE_NAME, createSession, getSession, destroySession };
