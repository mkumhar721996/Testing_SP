'use strict';

/** Returns a checker that authorizes only the exact required role. AC4. */
function requireRole(requiredRole) {
  return function isAuthorized(role) {
    return role === requiredRole;
  };
}

module.exports = { requireRole };
