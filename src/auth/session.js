'use strict';

const crypto = require('node:crypto');

const VALID_ROLES = ['Manager', 'Tester', 'Developer'];

/** In-memory signed-in-session lookup: token -> role. */
function createSessionStore() {
  const sessions = new Map();

  return {
    create(role) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, role);
      return token;
    },
    getRole(token) {
      return sessions.get(token);
    },
  };
}

module.exports = { createSessionStore, VALID_ROLES };
