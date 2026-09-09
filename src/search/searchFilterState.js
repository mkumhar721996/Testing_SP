import { filterSearchResults } from './filterSearchResults.js';

export function createSearchFilterState(baseResults) {
  const activeFilters = {};

  return {
    setFilter(key, value) {
      activeFilters[key] = value;
    },
    clearFilter(key) {
      delete activeFilters[key];
    },
    clearAllFilters() {
      for (const key of Object.keys(activeFilters)) {
        delete activeFilters[key];
      }
    },
    getFilteredResults() {
      return filterSearchResults(baseResults, activeFilters);
    },
  };
}
