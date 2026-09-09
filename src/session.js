const crypto = require('crypto');
const { log } = require('./logger');

const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

const sessions = new Map();

function createSession(data) {
  const id = crypto.randomUUID();
  sessions.set(id, { data, createdAt: Date.now() });
  log('info', 'session.created', { sessionId: id, activeSessions: sessions.size });
  return id;
}

function getSession(id) {
  if (!id) return undefined;
  const entry = sessions.get(id);
  if (!entry) return undefined;

  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    log('info', 'session.expired', { sessionId: id, activeSessions: sessions.size });
    return undefined;
  }

  return entry.data;
}

function destroySession(id) {
  sessions.delete(id);
  log('info', 'session.destroyed', { sessionId: id, activeSessions: sessions.size });
}

module.exports = { SESSION_COOKIE_NAME, createSession, getSession, destroySession };
