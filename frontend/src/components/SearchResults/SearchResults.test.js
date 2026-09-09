const test = require('node:test');
const assert = require('node:assert/strict');
const { createSearchResults } = require('./SearchResults');

function findAll(vnode, predicate, out = []) {
  if (!vnode || typeof vnode !== 'object') return out;
  if (predicate(vnode)) out.push(vnode);
  (vnode.children || []).forEach((child) => findAll(child, predicate, out));
  return out;
}

function isPaginationControl(vnode) {
  if (vnode.type === 'button' && vnode.props && vnode.props['data-testid'] !== 'retry-button') return true;
  if (vnode.props && vnode.props['data-testid'] === 'pagination') return true;
  if (vnode.props && typeof vnode.props['aria-label'] === 'string' && /page/i.test(vnode.props['aria-label'])) return true;
  return false;
}

function makeResults(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({ id: offset + i, name: `Result ${offset + i}` }));
}

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target) {
    this.target = target;
  }

  disconnect() {}

  intersect() {
    this.callback([{ isIntersecting: true, target: this.target }]);
  }
}
FakeIntersectionObserver.instances = [];

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

test('fetches and appends the next page when the bottom sentinel intersects the viewport', async () => {
  const pageSize = 20;
  const page2Items = makeResults(20, 20);
  let calls = [];
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: (cursor, size) => {
      calls.push([cursor, size]);
      return Promise.resolve({ items: page2Items, nextCursor: null });
    },
    pageSize,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [20, pageSize]);
  assert.equal(component.getState().results.length, 40);
  assert.equal(component.getState().results[20].id, 20);
});

test('continues fetching and appending successive pages (page 2, then page 3) as the sentinel keeps intersecting, advancing the cursor each time', async () => {
  const pageSize = 10;
  const pages = {
    10: { items: makeResults(10, 10), nextCursor: 20 },
    20: { items: makeResults(5, 20), nextCursor: null },
  };
  const calls = [];
  const component = createSearchResults({
    initialResults: makeResults(10, 0),
    initialCursor: 10,
    initialHasMore: true,
    fetchPage: (cursor, size) => {
      calls.push([cursor, size]);
      return Promise.resolve(pages[cursor]);
    },
    pageSize,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);

  observer.intersect();
  await flushMicrotasks();
  assert.equal(component.getState().results.length, 20);
  assert.equal(component.getState().hasMore, true);

  observer.intersect();
  await flushMicrotasks();
  assert.equal(component.getState().results.length, 25);
  assert.equal(component.getState().hasMore, false);

  assert.deepEqual(calls, [[10, pageSize], [20, pageSize]]);
});

test('requests each page with the configured page-size cap, never asking the server for more results than the cap', async () => {
  const pageSize = 15;
  let receivedSize = null;
  const component = createSearchResults({
    initialResults: makeResults(15, 0),
    initialCursor: 15,
    initialHasMore: true,
    fetchPage: (cursor, size) => {
      receivedSize = size;
      return Promise.resolve({ items: makeResults(15, 15), nextCursor: null });
    },
    pageSize,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  assert.equal(receivedSize, pageSize);
});

test('does not show a loading indicator before the sentinel has intersected for the first time', () => {
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => Promise.resolve({ items: [], nextCursor: null }),
    pageSize: 20,
  });

  const tree = component.render();
  const loadingNodes = findAll(tree, (n) => n.props && n.props['data-testid'] === 'loading-indicator');

  assert.equal(loadingNodes.length, 0);
});

test('shows a loading indicator at the bottom of the list while the next page is being fetched, and hides it once the fetch settles', async () => {
  let resolveFetch;
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();

  const duringFetchTree = component.render();
  const loadingDuringFetch = findAll(duringFetchTree, (n) => n.props && n.props['data-testid'] === 'loading-indicator');
  assert.equal(loadingDuringFetch.length, 1);

  resolveFetch({ items: makeResults(5, 20), nextCursor: null });
  await flushMicrotasks();

  const afterFetchTree = component.render();
  const loadingAfterFetch = findAll(afterFetchTree, (n) => n.props && n.props['data-testid'] === 'loading-indicator');
  assert.equal(loadingAfterFetch.length, 0);
});

test('does not call fetch again when the sentinel intersects after all results have already been loaded (hasMore is false)', async () => {
  let calls = 0;
  const component = createSearchResults({
    initialResults: makeResults(5, 0),
    initialCursor: null,
    initialHasMore: false,
    fetchPage: () => {
      calls += 1;
      return Promise.resolve({ items: [], nextCursor: null });
    },
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  assert.equal(calls, 0);
  assert.equal(component.getState().results.length, 5);
});

test('does not call fetch again even when the sentinel intersects multiple times in a row after exhaustion', async () => {
  let calls = 0;
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => {
      calls += 1;
      return Promise.resolve({ items: makeResults(5, 20), nextCursor: null });
    },
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();
  assert.equal(calls, 1);
  assert.equal(component.getState().hasMore, false);

  observer.intersect();
  observer.intersect();
  observer.intersect();
  await flushMicrotasks();

  assert.equal(calls, 1);
});

test('renders no load-more button or pagination control once all results have been loaded', async () => {
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => Promise.resolve({ items: makeResults(5, 20), nextCursor: null }),
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  const tree = component.render();
  const paginationControls = findAll(tree, isPaginationControl);

  assert.equal(paginationControls.length, 0);
});

test('shows an inline error message with a Retry button at the bottom of the list when a page fetch during scroll rejects', async () => {
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => Promise.reject(new Error('Network error')),
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  const tree = component.render();
  const errorNodes = findAll(tree, (n) => n.props && n.props['data-testid'] === 'load-more-error');
  const retryButtons = findAll(tree, (n) => n.props && n.props['data-testid'] === 'retry-button');

  assert.equal(errorNodes.length, 1);
  assert.equal(retryButtons.length, 1);
  assert.equal(component.getState().loading, false);
});

test('leaves previously rendered results unchanged, in the same order, when a subsequent page fetch fails', async () => {
  const initialResults = makeResults(20, 0);
  const component = createSearchResults({
    initialResults,
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => Promise.reject(new Error('Network error')),
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  const resultsAfterFailure = component.getState().results;
  assert.equal(resultsAfterFailure.length, 20);
  resultsAfterFailure.forEach((result, index) => {
    assert.equal(result, initialResults[index]);
  });
});

test('retries the same failed page fetch (same cursor) when the Retry button is clicked, and appends results on success', async () => {
  const calls = [];
  let attempt = 0;
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: (cursor, size) => {
      calls.push([cursor, size]);
      attempt += 1;
      if (attempt === 1) return Promise.reject(new Error('Network error'));
      return Promise.resolve({ items: makeResults(5, 20), nextCursor: null });
    },
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  const retryButton = findAll(component.render(), (n) => n.props && n.props['data-testid'] === 'retry-button')[0];
  retryButton.props.onClick();
  await flushMicrotasks();

  assert.deepEqual(calls, [[20, 20], [20, 20]]);
  assert.equal(component.getState().error, null);
  assert.equal(component.getState().results.length, 25);
});

test('keeps showing the error and Retry button if the retried fetch fails again', async () => {
  const component = createSearchResults({
    initialResults: makeResults(20, 0),
    initialCursor: 20,
    initialHasMore: true,
    fetchPage: () => Promise.reject(new Error('Network error')),
    pageSize: 20,
  });

  const observer = component.observeSentinel({}, FakeIntersectionObserver);
  observer.intersect();
  await flushMicrotasks();

  let retryButton = findAll(component.render(), (n) => n.props && n.props['data-testid'] === 'retry-button')[0];
  retryButton.props.onClick();
  await flushMicrotasks();

  const treeAfterSecondFailure = component.render();
  const errorNodes = findAll(treeAfterSecondFailure, (n) => n.props && n.props['data-testid'] === 'load-more-error');
  const retryButtons = findAll(treeAfterSecondFailure, (n) => n.props && n.props['data-testid'] === 'retry-button');

  assert.equal(errorNodes.length, 1);
  assert.equal(retryButtons.length, 1);
});

test('renders no pagination buttons or page-number controls when the initial results already fit within a single page', () => {
  const component = createSearchResults({
    initialResults: makeResults(3),
    initialCursor: null,
    initialHasMore: false,
    fetchPage: () => Promise.resolve({ items: [], nextCursor: null }),
    pageSize: 20,
  });

  const tree = component.render();
  const paginationControls = findAll(tree, isPaginationControl);

  assert.equal(paginationControls.length, 0);
});
