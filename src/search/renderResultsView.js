const NO_RESULTS_MESSAGE = 'No results match your filters. Try adjusting or clearing them.';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderResultCard(restaurant) {
  return `
    <article class="card">
      <div class="card-body">
        <h3>${escapeHtml(restaurant.name)}</h3>
        <span class="chip">${escapeHtml(restaurant.rating)}★</span>
        <span class="chip">${escapeHtml(restaurant.estimatedDeliveryMinutes)} min</span>
        <span class="chip">${escapeHtml(restaurant.deliveryFeeCents)}¢ delivery</span>
      </div>
    </article>
  `.trim();
}

export function renderResultsView(filteredResults) {
  if (filteredResults.length === 0) {
    return `<p class="text-muted">${NO_RESULTS_MESSAGE}</p>`;
  }

  return filteredResults.map(renderResultCard).join('\n');
}
