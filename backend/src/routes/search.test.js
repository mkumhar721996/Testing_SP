const test = require('node:test');
const assert = require('node:assert/strict');
const { createSearchServer } = require('./search');

function makeResults(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i, name: `Restaurant ${i}` }));
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

test('GET /api/search returns the first page capped at the configured page size, and returns a nextCursor that fetches the next capped page', async () => {
  const pageSize = 5;
  const allResults = makeResults(12);
  const server = createSearchServer({ getResults: () => allResults, pageSize });
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
