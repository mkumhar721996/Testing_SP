const defaultSearchApi = require('./searchApi');

const RETRY_ACTION_ID = 'retry';

function clear(container) {
  container.textContent = '';
}

function renderResults(container, results) {
  clear(container);
  const list = document.createElement('ul');
  list.classList.add('search-results-list');
  results.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item.name;
    list.appendChild(li);
  });
  container.appendChild(list);
}

function renderError(container, query, error, deps) {
  clear(container);

  const banner = document.createElement('div');
  banner.classList.add('error-banner', 'chip-danger');
  banner.setAttribute('role', 'alert');

  const message = document.createElement('p');
  message.textContent = error.message || 'Something went wrong. Please try again.';
  banner.appendChild(message);

  const retryButton = document.createElement('button');
  retryButton.classList.add('btn', 'btn-danger');
  retryButton.setAttribute('data-action', RETRY_ACTION_ID);
  retryButton.textContent = 'Retry';
  retryButton.addEventListener('click', () => {
    search(container, query, deps);
  });
  banner.appendChild(retryButton);

  container.appendChild(banner);
}

function search(container, query, deps = {}) {
  const api = deps.searchApi || defaultSearchApi;
  return api
    .searchRestaurants(query)
    .then((results) => renderResults(container, results))
    .catch((error) => renderError(container, query, error, deps));
}

module.exports = { search };
