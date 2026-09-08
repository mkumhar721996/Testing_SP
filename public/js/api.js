(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.DefectDashboardApi = factory(root.fetch ? root.fetch.bind(root) : undefined);
  }
})(typeof window !== 'undefined' ? window : this, function (fetchImpl) {
  'use strict';

  function buildDefectsQueryString(options = {}) {
    const params = new URLSearchParams();
    if (options.selection) {
      params.set('selectionType', options.selection.type);
      params.set('selectionValue', options.selection.value);
    }
    if (options.sortKey) params.set('sortKey', options.sortKey);
    if (options.sortDir) params.set('sortDir', options.sortDir);
    if (options.page) params.set('page', String(options.page));
    return params.toString();
  }

  async function fetchJson(url) {
    const res = await fetchImpl(url, { credentials: 'same-origin' });
    if (!res.ok) {
      const err = new Error('Request failed: ' + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function fetchSummary() {
    return fetchJson('/api/dashboard/summary');
  }

  function fetchDefects(options) {
    return fetchJson('/api/defects?' + buildDefectsQueryString(options));
  }

  return { buildDefectsQueryString, fetchSummary, fetchDefects };
});
