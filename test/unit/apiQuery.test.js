'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDefectsQueryString } = require('../../public/js/api');

test('buildDefectsQueryString encodes selection type/value, sort, and page', () => {
  const qs = buildDefectsQueryString({
    selection: { type: 'severity', value: 'Medium' },
    sortKey: 'title',
    sortDir: 'asc',
    page: 2,
  });
  const params = new URLSearchParams(qs);
  assert.equal(params.get('selectionType'), 'severity');
  assert.equal(params.get('selectionValue'), 'Medium');
  assert.equal(params.get('sortKey'), 'title');
  assert.equal(params.get('sortDir'), 'asc');
  assert.equal(params.get('page'), '2');
});

test('buildDefectsQueryString omits selection params when no selection is given', () => {
  const qs = buildDefectsQueryString({ sortKey: 'created', sortDir: 'desc', page: 1 });
  const params = new URLSearchParams(qs);
  assert.equal(params.has('selectionType'), false);
  assert.equal(params.has('selectionValue'), false);
});
