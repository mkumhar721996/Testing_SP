'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { barHeightPx, maxOf, shouldDisable } = require('../../public/js/chartLayout');

test('AC10: maxOf on an all-zero (or empty) series returns 1, avoiding divide-by-zero', () => {
  assert.equal(maxOf([]), 1);
  assert.equal(maxOf([0, 0, 0]), 1);
});

test('maxOf returns the largest value in a non-empty series', () => {
  assert.equal(maxOf([2, 9, 4]), 9);
});

test('AC10: a zero count still yields a minimum-height placeholder bar (layout preserved)', () => {
  assert.equal(barHeightPx(0, 10, 118), 2);
});

test('a count equal to the max fills the full bar height', () => {
  assert.equal(barHeightPx(10, 10, 118), 118);
});

test('AC1/AC6: trend and status bars are disabled only at a zero count', () => {
  assert.equal(shouldDisable(0), true);
  assert.equal(shouldDisable(1), false);
});
