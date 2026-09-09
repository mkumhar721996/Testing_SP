const test = require('node:test');
const assert = require('node:assert/strict');
const { createSearchServer } = require('./search');

const silentLogger = { log: () => {}, error: () => {} };

function makeResults(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i, name: `Restaurant ${i}` }));
}

// Mimics a real data layer honoring `{ cursor, limit }` as LIMIT/OFFSET — proves the route
// only asks for the window it needs rather than fetching every matching result up front.
function windowedGetResults(allResults) {
  return (_query, { cursor, limit }) => allResults.slice(cursor, cursor + limit);
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

test('GET /api/search returns the first page capped at the configured page size, and returns a nextCursor that fetches the next capped page', async () => {
  const pageSize = 5;
  const allResults = makeResults(12);
  const server = createSearchServer({
    getResults: windowedGetResults(allResults),
    pageSize,
    logger: silentLogger,
  });
  const port = await listen(server);

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza`);
    const firstPage = await firstResponse.json();
    assert.equal(firstResponse.status, 200);
    assert.equal(firstPage.items.length, pageSize);
    assert.equal(firstPage.nextCursor, 5);

    const secondResponse = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza&cursor=${firstPage.nextCursor}`);
    const secondPage = await secondResponse.json();
    assert.equal(secondPage.items.length, pageSize);
    assert.equal(secondPage.nextCursor, 10);

    const thirdResponse = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza&cursor=${secondPage.nextCursor}`);
    const thirdPage = await thirdResponse.json();
    assert.equal(thirdPage.items.length, 2);
    assert.equal(thirdPage.nextCursor, null);
  } finally {
    server.close();
  }
});

test('only requests the window needed for the current page from the data layer, not the entire result set', async () => {
  const pageSize = 5;
  const allResults = makeResults(500);
  const receivedLimits = [];
  const server = createSearchServer({
    getResults: (_query, { cursor, limit }) => {
      receivedLimits.push(limit);
      return allResults.slice(cursor, cursor + limit);
    },
    pageSize,
    logger: silentLogger,
  });
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza`);
    await response.json();

    assert.deepEqual(receivedLimits, [pageSize + 1]);
  } finally {
    server.close();
  }
});

test('treats a non-numeric cursor as the start of the results, rather than erroring', async () => {
  const pageSize = 5;
  const allResults = makeResults(12);
  const server = createSearchServer({
    getResults: windowedGetResults(allResults),
    pageSize,
    logger: silentLogger,
  });
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza&cursor=abc`);
    const page = await response.json();

    assert.equal(response.status, 200);
    assert.equal(page.items.length, pageSize);
    assert.equal(page.items[0].id, 0);
  } finally {
    server.close();
  }
});

test('treats a negative cursor as the start of the results, rather than erroring', async () => {
  const pageSize = 5;
  const allResults = makeResults(12);
  const server = createSearchServer({
    getResults: windowedGetResults(allResults),
    pageSize,
    logger: silentLogger,
  });
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza&cursor=-10`);
    const page = await response.json();

    assert.equal(response.status, 200);
    assert.equal(page.items.length, pageSize);
    assert.equal(page.items[0].id, 0);
  } finally {
    server.close();
  }
});

test('returns a 500 error and logs the failure when the data layer throws, without crashing the server', async () => {
  const loggedErrors = [];
  const logger = { log: () => {}, error: (msg) => loggedErrors.push(msg) };
  const server = createSearchServer({
    getResults: () => {
      throw new Error('data layer unavailable');
    },
    pageSize: 5,
    logger,
  });
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(typeof body.error, 'string');
    assert.equal(loggedErrors.length, 1);
    assert.match(loggedErrors[0], /data layer unavailable/);
    assert.equal(server.metrics.errorCount, 1);

    // The server process itself must survive a single request's failure.
    const followUpResponse = await fetch(`http://127.0.0.1:${port}/api/search?q=pizza`);
    assert.equal(followUpResponse.status, 500);
  } finally {
    server.close();
  }
});
