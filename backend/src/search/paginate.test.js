const test = require('node:test');
const assert = require('node:assert/strict');
const { paginate } = require('./paginate');

function makeResults(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i, name: `Result ${i}` }));
}

test('returns at most the configured page size for the initial page and for every subsequent page, regardless of total result count', () => {
  const results = makeResults(45);
  const pageSize = 20;

  const page1 = paginate(results, { cursor: 0, pageSize });
  assert.equal(page1.items.length, pageSize);
  assert.equal(page1.nextCursor, 20);

  const page2 = paginate(results, { cursor: page1.nextCursor, pageSize });
  assert.equal(page2.items.length, pageSize);
  assert.equal(page2.nextCursor, 40);

  const page3 = paginate(results, { cursor: page2.nextCursor, pageSize });
  assert.equal(page3.items.length, 5);
  assert.equal(page3.nextCursor, null);
});

test('returns a null nextCursor exactly when the total result count is an exact multiple of the page size (no trailing empty page)', () => {
  const results = makeResults(40);
  const pageSize = 20;

  const page1 = paginate(results, { cursor: 0, pageSize });
  assert.equal(page1.items.length, pageSize);
  assert.equal(page1.nextCursor, 20);

  const page2 = paginate(results, { cursor: page1.nextCursor, pageSize });
  assert.equal(page2.items.length, pageSize);
  assert.equal(page2.nextCursor, null, 'no trailing empty page should be indicated when results end exactly on a page boundary');
});
