import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderResultsView } from './renderResultsView.js';

const results = [
  { id: 'a', name: 'Alpha', rating: 4.5, estimatedDeliveryMinutes: 20, deliveryFeeCents: 199 },
];

test('AC4: renders the no-results empty state when filters match no restaurants', () => {
  const markup = renderResultsView([]);

  assert.match(markup, /no results/i);
  assert.doesNotMatch(markup, /class="card"/);
});

test('AC4: renders restaurant result cards and omits the empty state when results are non-empty', () => {
  const markup = renderResultsView(results);

  assert.doesNotMatch(markup, /no results/i);
  assert.match(markup, /Alpha/);
  assert.match(markup, /class="card"/);
});
