import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterSearchResults } from './filterSearchResults.js';

const restaurants = [
  { id: 'a', name: 'Alpha', rating: 4.5, estimatedDeliveryMinutes: 20, deliveryFeeCents: 199 },
  { id: 'b', name: 'Bravo', rating: 4.5, estimatedDeliveryMinutes: 45, deliveryFeeCents: 399 },
  { id: 'c', name: 'Charlie', rating: 3.0, estimatedDeliveryMinutes: 15, deliveryFeeCents: 99 },
];

test('AC1: applies AND logic across simultaneously active filters, not OR/union', () => {
  const result = filterSearchResults(restaurants, { minRating: 4, maxDeliveryFeeCents: 199 });

  assert.deepEqual(
    result.map((r) => r.id),
    ['a']
  );
});

test('AC1: a single active filter narrows by that criterion alone', () => {
  const result = filterSearchResults(restaurants, { minRating: 4 });

  assert.deepEqual(
    result.map((r) => r.id),
    ['a', 'b']
  );
});

test('AC1: no active filters returns all results unchanged', () => {
  const result = filterSearchResults(restaurants, {});

  assert.deepEqual(result, restaurants);
});

test('AC1: three simultaneously active filters all must match', () => {
  const result = filterSearchResults(restaurants, {
    minRating: 3,
    maxEstimatedDeliveryMinutes: 30,
    maxDeliveryFeeCents: 150,
  });

  assert.deepEqual(
    result.map((r) => r.id),
    ['c']
  );
});
