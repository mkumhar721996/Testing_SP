const test = require('node:test');
const assert = require('node:assert/strict');
const { paginate } = require('./paginate');

function makeResults(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({ id: offset + i, name: `Result ${offset + i}` }));
}

// Mirrors what a real data layer would return for `LIMIT pageSize + 1 OFFSET cursor`.
function windowFor(allResults, cursor, pageSize) {
  return allResults.slice(cursor, cursor + pageSize + 1);
}

test('returns at most the configured page size for the initial page and for every subsequent page, regardless of total result count', () => {
  const allResults = makeResults(45);
  const pageSize = 20;

  const page1 = paginate(windowFor(allResults, 0, pageSize), { cursor: 0, pageSize });
  assert.equal(page1.items.length, pageSize);
  assert.equal(page1.nextCursor, 20);

  const page2 = paginate(windowFor(allResults, page1.nextCursor, pageSize), { cursor: page1.nextCursor, pageSize });
  assert.equal(page2.items.length, pageSize);
  assert.equal(page2.nextCursor, 40);

  const page3 = paginate(windowFor(allResults, page2.nextCursor, pageSize), { cursor: page2.nextCursor, pageSize });
  assert.equal(page3.items.length, 5);
  assert.equal(page3.nextCursor, null);
});

test('returns a null nextCursor exactly when the total result count is an exact multiple of the page size (no trailing empty page)', () => {
  const allResults = makeResults(40);
  const pageSize = 20;

  const page1 = paginate(windowFor(allResults, 0, pageSize), { cursor: 0, pageSize });
  assert.equal(page1.items.length, pageSize);
  assert.equal(page1.nextCursor, 20);

  const page2 = paginate(windowFor(allResults, page1.nextCursor, pageSize), { cursor: page1.nextCursor, pageSize });
  assert.equal(page2.items.length, pageSize);
  assert.equal(page2.nextCursor, null, 'no trailing empty page should be indicated when results end exactly on a page boundary');
});

test('never returns more than the configured cap even when handed a larger window than requested', () => {
  const pageSize = 10;
  const oversizedWindow = makeResults(50);

  const page = paginate(oversizedWindow, { cursor: 0, pageSize });

  assert.equal(page.items.length, pageSize);
  assert.equal(page.nextCursor, 10);
});

test('throws when pageSize is zero, negative, or non-integer', () => {
  const window = makeResults(5);

  assert.throws(() => paginate(window, { cursor: 0, pageSize: 0 }), /pageSize must be a positive integer/);
  assert.throws(() => paginate(window, { cursor: 0, pageSize: -5 }), /pageSize must be a positive integer/);
  assert.throws(() => paginate(window, { cursor: 0, pageSize: 3.14 }), /pageSize must be a positive integer/);
});
