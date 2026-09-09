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

export function renderError(container, { doc = document } = {}) {
  clear(container);
  const message = doc.createElement("p");
  message.classList.add("text-muted");
  message.setAttribute("data-testid", "search-error");
  message.setAttribute("role", "alert");
  message.textContent = "Something went wrong loading restaurants. Please try again.";
  container.appendChild(message);
}

function isValidRestaurant(restaurant) {
  return (
    restaurant &&
    typeof restaurant.id !== "undefined" &&
    typeof restaurant.name === "string" &&
    typeof restaurant.cuisine === "string" &&
    typeof restaurant.rating === "number" &&
    Number.isFinite(restaurant.rating) &&
    typeof restaurant.estimatedDeliveryMinutes === "number" &&
    typeof restaurant.deliveryFeeCents === "number" &&
    typeof restaurant.isOpen === "boolean"
  );
}

export function renderResults(container, results, { onSelect, doc = document } = {}) {
  clear(container);

  const list = doc.createElement("div");
  list.classList.add("stack");
  list.setAttribute("data-testid", "restaurant-results");

  for (const restaurant of results) {
    if (!isValidRestaurant(restaurant)) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "invalid_restaurant_data",
          restaurantId: restaurant && restaurant.id,
        }),
      );
      continue;
    }

    const card = doc.createElement("article");
    card.classList.add("card");
    card.setAttribute("data-testid", "restaurant-card");
    card.setAttribute("data-restaurant-id", String(restaurant.id));
    card.setAttribute("data-available", restaurant.isOpen ? "true" : "false");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", restaurant.name);
    card.setAttribute("tabindex", restaurant.isOpen ? "0" : "-1");
    if (!restaurant.isOpen) {
      card.classList.add("card--unavailable");
      card.setAttribute("aria-disabled", "true");
    }

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
      const selectRestaurant = () => onSelect(restaurant.id);
      card.addEventListener("click", selectRestaurant);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          if (typeof event.preventDefault === "function") event.preventDefault();
          selectRestaurant();
        }
      });
    }

    list.appendChild(card);
  }

  container.appendChild(list);
}
