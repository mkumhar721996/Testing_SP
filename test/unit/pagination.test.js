'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computePageButtons } = require('../../public/js/pagination');

test('AC13: with 2 total pages on page 1, prev is disabled and both page numbers are shown', () => {
  const buttons = computePageButtons(1, 2);
  assert.deepEqual(buttons.map((b) => b.label), ['←', '1', '2', '→']);
  assert.equal(buttons.find((b) => b.label === '←').disabled, true);
  assert.equal(buttons.find((b) => b.label === '→').disabled, false);
  assert.equal(buttons.find((b) => b.label === '1').isActive, true);
  assert.equal(buttons.find((b) => b.label === '2').isActive, false);
});

test('AC13: on the last page, next is disabled', () => {
  const buttons = computePageButtons(2, 2);
  assert.equal(buttons.find((b) => b.label === '→').disabled, true);
  assert.equal(buttons.find((b) => b.label === '2').isActive, true);
});

test('a single page produces no page-button row at all', () => {
  const buttons = computePageButtons(1, 1);
  assert.deepEqual(buttons, []);
});
