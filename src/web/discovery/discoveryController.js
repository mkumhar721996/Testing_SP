import { renderLoading, renderNoResults, renderResults } from "./discoveryView.js";

export function initDiscoveryController({
  formEl,
  inputEl,
  resultsEl,
  onSelect,
  fetchImpl = fetch,
  doc = document,
} = {}) {
  async function handleSubmit(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();

    const query = inputEl.value || "";
    renderLoading(resultsEl, { doc });

    const response = await fetchImpl(`/api/restaurants/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      renderNoResults(resultsEl, { doc });
    } else {
      renderResults(resultsEl, results, { onSelect, doc });
    }
  }

  formEl.addEventListener("submit", handleSubmit);
}
