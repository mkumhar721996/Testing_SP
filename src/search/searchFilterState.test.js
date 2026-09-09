import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearchFilterState } from './searchFilterState.js';

const baseResults = [
  { id: 'a', name: 'Alpha', rating: 4.5, estimatedDeliveryMinutes: 20, deliveryFeeCents: 199 },
  { id: 'b', name: 'Bravo', rating: 4.5, estimatedDeliveryMinutes: 45, deliveryFeeCents: 399 },
  { id: 'c', name: 'Charlie', rating: 3.0, estimatedDeliveryMinutes: 15, deliveryFeeCents: 99 },
];

test('AC2: removing one of several active filters recomputes results from the remaining filters only', () => {
  const state = createSearchFilterState(baseResults);

  state.setFilter('minRating', 4);
  state.setFilter('maxEstimatedDeliveryMinutes', 30);

  assert.deepEqual(
    state.getFilteredResults().map((r) => r.id),
    ['a']
  );

  state.clearFilter('maxEstimatedDeliveryMinutes');

  assert.deepEqual(
    state.getFilteredResults().map((r) => r.id),
    ['a', 'b']
  );
});

test('AC3: clearing all filters restores the full ranked baseResults, unfiltered and in original order', () => {
  const state = createSearchFilterState(baseResults);

  state.setFilter('minRating', 4);
  state.setFilter('maxDeliveryFeeCents', 199);
  assert.deepEqual(
    state.getFilteredResults().map((r) => r.id),
    ['a']
  );

  state.clearAllFilters();

  assert.deepEqual(state.getFilteredResults(), baseResults);
});
