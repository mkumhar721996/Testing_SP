const http = require('node:http');
const { URL } = require('node:url');
const { paginate } = require('../search/paginate');

const DEFAULT_PAGE_SIZE = 20;

function sanitizeCursor(cursorParam) {
  const parsed = cursorParam !== null ? Number(cursorParam) : 0;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function createSearchServer({ getResults, pageSize = DEFAULT_PAGE_SIZE, logger = console }) {
  const metrics = { requestCount: 0, errorCount: 0 };

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');

    if (req.method !== 'GET' || requestUrl.pathname !== '/api/search') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const query = requestUrl.searchParams.get('q') || '';
    const cursor = sanitizeCursor(requestUrl.searchParams.get('cursor'));
    metrics.requestCount += 1;
    const startedAt = Date.now();

    let items;
    let nextCursor;
    try {
      // Ask the data layer for only the window this page needs (LIMIT/OFFSET or equivalent),
      // rather than materializing every matching result on every request. `pageSize + 1` lets
      // paginate() detect "is there a next page" without a separate total-count query.
      const window = getResults(query, { cursor, limit: pageSize + 1 });
      ({ items, nextCursor } = paginate(window, { cursor, pageSize }));
    } catch (err) {
      metrics.errorCount += 1;
      logger.error(
        JSON.stringify({
          event: 'search_request_failed',
          query,
          cursor,
          error: err && err.message,
          stack: err && err.stack,
        })
      );
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }

    logger.log(
      JSON.stringify({
        event: 'search_request_succeeded',
        query,
        cursor,
        resultCount: items.length,
        nextCursor,
        durationMs: Date.now() - startedAt,
      })
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items, nextCursor }));
  });

  server.metrics = metrics;
  return server;
}

module.exports = { createSearchServer, DEFAULT_PAGE_SIZE };
