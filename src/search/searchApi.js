const SEARCH_ENDPOINT = '/api/restaurants/search';

class SearchError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'SearchError';
    this.status = status;
    this.cause = cause;
  }
}

async function searchRestaurants(query, { fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`);
  } catch (cause) {
    throw new SearchError('Unable to reach the search service. Please check your connection and try again.', {
      cause,
    });
  }
  if (!response.ok) {
    throw new SearchError('The search service returned an error. Please try again.', { status: response.status });
  }
  return response.json();
}

module.exports = { searchRestaurants, SearchError };
