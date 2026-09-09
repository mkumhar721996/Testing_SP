import { renderLoading, renderNoResults, renderResults, renderError } from "./discoveryView.js";

export function initDiscoveryController({
  formEl,
  inputEl,
  resultsEl,
  onSelect,
  fetchImpl = fetch,
  doc = document,
} = {}) {
  let activeRequest = null;

  async function handleSubmit(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();

    const query = (inputEl.value || "").trim();
    if (!query) return;

    if (activeRequest) activeRequest.abort();
    const controller = new AbortController();
    activeRequest = controller;

    renderLoading(resultsEl, { doc });

    try {
      const response = await fetchImpl(`/api/restaurants/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        renderNoResults(resultsEl, { doc });
      } else {
        renderResults(resultsEl, results, { onSelect, doc });
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(
        JSON.stringify({ level: "error", event: "discovery_search_failed", query, message: error.message }),
      );
      renderError(resultsEl, { doc });
    }
  }

  formEl.addEventListener("submit", handleSubmit);
}
