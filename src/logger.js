const crypto = require('crypto');

function log(level, event, fields = {}) {
  const entry = { level, event, time: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (level === 'warn' || level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

// Reuses an inbound trace header if a proxy/load balancer already set one,
// otherwise mints a fresh id so this request's auth events can be
// correlated across the login -> session -> discovery-access flow.
function getRequestId(req) {
  return (
    req.headers['x-request-id'] || req.headers['x-trace-id'] || crypto.randomUUID()
  );
}

module.exports = { log, getRequestId };
