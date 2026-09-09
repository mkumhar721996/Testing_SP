function h(type, props, children) {
  return { type, props: props || {}, children: children || [] };
}

function renderTree(state, handlers) {
  const resultItems = state.results.map((result) =>
    h('li', { 'data-testid': 'result-item', key: result.id }, [result.name])
  );

  const trailing = [];

  if (state.loading) {
    trailing.push(h('div', { 'data-testid': 'loading-indicator' }, ['Loading more results…']));
  } else if (state.error) {
    trailing.push(
      h('div', { 'data-testid': 'load-more-error' }, [
        h('p', { 'data-testid': 'load-more-error-message' }, [state.error]),
        h(
          'button',
          { type: 'button', 'data-testid': 'retry-button', onClick: handlers.onRetry },
          ['Retry']
        ),
      ])
    );
  }

  trailing.push(h('div', { 'data-testid': 'scroll-sentinel' }, []));

  return h('div', { 'data-testid': 'search-results' }, [
    h('ul', { 'data-testid': 'results-list' }, resultItems),
    ...trailing,
  ]);
}

function createSearchResults({
  initialResults = [],
  initialCursor = null,
  initialHasMore = false,
  fetchPage,
  pageSize,
}) {
  let state = {
    results: initialResults.slice(),
    cursor: initialCursor,
    hasMore: initialHasMore,
    loading: false,
    error: null,
  };

  const listeners = new Set();

  function setState(patch) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  }

  function getState() {
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function loadNextPage() {
    const cursorToFetch = state.cursor;
    setState({ loading: true, error: null });

    return fetchPage(cursorToFetch, pageSize)
      .then((page) => {
        setState({
          results: state.results.concat(page.items),
          cursor: page.nextCursor,
          hasMore: page.nextCursor !== null && page.nextCursor !== undefined,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        setState({
          loading: false,
          error: (err && err.message) || 'Failed to load results',
        });
      });
  }

  function handleSentinelIntersect() {
    if (!state.hasMore || state.loading) return undefined;
    return loadNextPage();
  }

  function retry() {
    if (!state.error) return undefined;
    return loadNextPage();
  }

  function render() {
    return renderTree(state, { onRetry: retry });
  }

  function observeSentinel(sentinelEl, ObserverImpl) {
    const Impl = ObserverImpl || globalThis.IntersectionObserver;
    const observer = new Impl((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) handleSentinelIntersect();
      });
    });
    observer.observe(sentinelEl);
    return observer;
  }

  return {
    getState,
    subscribe,
    render,
    retry,
    handleSentinelIntersect,
    observeSentinel,
  };
}

module.exports = { createSearchResults, h };
