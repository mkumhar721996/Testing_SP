const test = require('node:test');
const assert = require('node:assert/strict');

const { createFakeDocument } = require('./testUtils/fakeDom');
const { createMockSearchApi } = require('./testUtils/mockSearchApi');

global.document = createFakeDocument();

const locationCalls = [];
global.window = {
  location: {
    assign(url) {
      locationCalls.push(url);
    },
    set href(url) {
      locationCalls.push(url);
    },
  },
};

const searchResultsView = require('./searchResultsView');
const { SearchError } = require('./searchApi');

test('AC1: shows an inline error inside the results container and does not navigate on network failure', async () => {
  const container = document.createElement('div');
  const searchApi = createMockSearchApi([{ error: new TypeError('Failed to fetch') }]);

  await searchResultsView.search(container, 'burgers', { searchApi });

  const banner = container.querySelector('[role="alert"]');
  assert.ok(banner, 'expected an inline alert banner in the results container');
  assert.equal(container.querySelectorAll('li').length, 0);
  assert.deepEqual(locationCalls, []);
});

test('AC1: shows an inline error inside the results container on a server error response', async () => {
  const container = document.createElement('div');
  const searchApi = createMockSearchApi([
    { error: new SearchError('The search service returned an error. Please try again.', { status: 500 }) },
  ]);

  await searchResultsView.search(container, 'burgers', { searchApi });

  const banner = container.querySelector('[role="alert"]');
  assert.ok(banner, 'expected an inline alert banner in the results container');
  assert.equal(container.querySelectorAll('li').length, 0);
  assert.deepEqual(locationCalls, []);
});

test('AC2: clicking Retry resubmits the exact same search', async () => {
  const container = document.createElement('div');
  const searchApi = createMockSearchApi([
    { error: new TypeError('Failed to fetch') },
    { error: new TypeError('Failed to fetch') },
  ]);

  await searchResultsView.search(container, 'burgers', { searchApi });

  const retryButton = container.querySelector('.error-banner button[data-action="retry"]');
  assert.ok(retryButton, 'expected a retry button in the error banner');
  retryButton.click();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(searchApi.calls, ['burgers', 'burgers']);
});

test('AC3: a successful retry clears the error and renders results normally', async () => {
  const container = document.createElement('div');
  const searchApi = createMockSearchApi([
    { error: new TypeError('Failed to fetch') },
    { results: [{ name: 'Burger Palace' }, { name: 'Fry Heaven' }] },
  ]);

  await searchResultsView.search(container, 'burgers', { searchApi });
  const retryButton = container.querySelector('.error-banner button[data-action="retry"]');
  retryButton.click();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(container.querySelector('.error-banner'), null);
  assert.equal(container.querySelectorAll('li').length, 2);
});

test('AC4: a failed retry re-shows the inline error with Retry still available', async () => {
  const container = document.createElement('div');
  const searchApi = createMockSearchApi([
    { error: new TypeError('Failed to fetch') },
    { error: new TypeError('Failed to fetch') },
  ]);

  await searchResultsView.search(container, 'burgers', { searchApi });
  const firstRetryButton = container.querySelector('.error-banner button[data-action="retry"]');
  firstRetryButton.click();
  await Promise.resolve();
  await Promise.resolve();

  const banner = container.querySelector('[role="alert"]');
  assert.ok(banner, 'expected the inline alert banner to be shown again');
  const retryButton = container.querySelector('.error-banner button[data-action="retry"]');
  assert.ok(retryButton, 'expected the retry button to still be present');
  assert.notEqual(retryButton.getAttribute('disabled'), '');
});
