function clear(container) {
  container.textContent = "";
}

function formatFee(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function renderLoading(container, { doc = document } = {}) {
  clear(container);
  const indicator = doc.createElement("div");
  indicator.classList.add("spinner");
  indicator.setAttribute("data-testid", "loading-indicator");
  indicator.textContent = "Loading restaurants…";
  container.appendChild(indicator);
}

export function renderNoResults(container, { doc = document } = {}) {
  clear(container);
  const message = doc.createElement("p");
  message.classList.add("text-muted");
  message.setAttribute("data-testid", "no-results");
  message.textContent = "No restaurants found.";
  container.appendChild(message);
}

export function renderResults(container, results, { onSelect, doc = document } = {}) {
  clear(container);

  const list = doc.createElement("div");
  list.classList.add("stack");
  list.setAttribute("data-testid", "restaurant-results");

  for (const restaurant of results) {
    const card = doc.createElement("article");
    card.classList.add("card");
    card.setAttribute("data-testid", "restaurant-card");
    card.setAttribute("data-restaurant-id", String(restaurant.id));
    card.setAttribute("data-available", restaurant.isOpen ? "true" : "false");
    if (!restaurant.isOpen) card.classList.add("card--unavailable");

    const header = doc.createElement("div");
    header.classList.add("card-header", "row");

    const name = doc.createElement("h3");
    name.textContent = restaurant.name;
    header.appendChild(name);

    if (!restaurant.isOpen) {
      const badge = doc.createElement("span");
      badge.classList.add("chip", "chip-warning");
      badge.setAttribute("data-testid", "unavailable-badge");
      badge.textContent = "Unavailable";
      header.appendChild(badge);
    }

    card.appendChild(header);

    const body = doc.createElement("div");
    body.classList.add("card-body", "stack-sm");

    const cuisine = doc.createElement("span");
    cuisine.classList.add("chip", "chip-primary");
    cuisine.textContent = restaurant.cuisine;
    body.appendChild(cuisine);

    const meta = doc.createElement("div");
    meta.classList.add("row", "text-sm", "text-muted");
    meta.textContent = `${restaurant.rating.toFixed(1)} ★ · ${restaurant.estimatedDeliveryMinutes} min · ${formatFee(restaurant.deliveryFeeCents)} delivery`;
    body.appendChild(meta);

    card.appendChild(body);

    if (restaurant.isOpen && typeof onSelect === "function") {
      card.addEventListener("click", () => onSelect(restaurant.id));
    }

    list.appendChild(card);
  }

  container.appendChild(list);
}
