const http = require('node:http');
const { URL } = require('node:url');
const { paginate } = require('../search/paginate');

const DEFAULT_PAGE_SIZE = 20;

function createSearchServer({ getResults, pageSize = DEFAULT_PAGE_SIZE }) {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');

    if (req.method !== 'GET' || requestUrl.pathname !== '/api/search') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const query = requestUrl.searchParams.get('q') || '';
    const cursorParam = requestUrl.searchParams.get('cursor');
    const cursor = cursorParam !== null ? Number(cursorParam) : 0;

    const allResults = getResults(query);
    const { items, nextCursor } = paginate(allResults, { cursor, pageSize });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items, nextCursor }));
  });
}

module.exports = { createSearchServer, DEFAULT_PAGE_SIZE };
