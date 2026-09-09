import test from "node:test";
import assert from "node:assert/strict";
import { document } from "../../test-utils/domShim.js";
import {
  renderLoading,
  renderNoResults,
  renderResults,
  renderError,
} from "../../src/web/discovery/discoveryView.js";

const OPEN_RESTAURANT = {
  id: "open-1",
  name: "Open Burger",
  cuisine: "American",
  rating: 4.5,
  estimatedDeliveryMinutes: 20,
  deliveryFeeCents: 199,
  isOpen: true,
};

const CLOSED_RESTAURANT = {
  id: "closed-1",
  name: "Closed Burger",
  cuisine: "American",
  rating: 4.0,
  estimatedDeliveryMinutes: 25,
  deliveryFeeCents: 249,
  isOpen: false,
};

function makeContainer() {
  return document.createElement("div");
}

test("renderLoading shows a loading indicator", () => {
  const container = makeContainer();
  renderLoading(container, { doc: document });

  assert.ok(container.querySelector('[data-testid="loading-indicator"]'));
});

test("renderNoResults shows a plain no-results message with no restaurant cards", () => {
  const container = makeContainer();
  renderNoResults(container, { doc: document });

  assert.ok(container.querySelector('[data-testid="no-results"]'));
  assert.equal(container.querySelectorAll('[data-testid="restaurant-card"]').length, 0);
});

test("renderResults shows name, cuisine, rating, delivery time, and delivery fee for each result", () => {
  const container = makeContainer();
  renderResults(container, [OPEN_RESTAURANT], { doc: document });

  const card = container.querySelector('[data-testid="restaurant-card"]');
  assert.ok(card);
  assert.match(card.textContent, /Open Burger/);
  assert.match(card.textContent, /American/);
  assert.match(card.textContent, /4\.5/);
  assert.match(card.textContent, /20 min/);
  assert.match(card.textContent, /\$1\.99/);
});

test("renderResults clearly marks an unavailable restaurant but not an open one", () => {
  const container = makeContainer();
  renderResults(container, [OPEN_RESTAURANT, CLOSED_RESTAURANT], { doc: document });

  const openCard = container.querySelector('[data-restaurant-id="open-1"]');
  const closedCard = container.querySelector('[data-restaurant-id="closed-1"]');

  assert.equal(openCard.querySelector('[data-testid="unavailable-badge"]'), null);
  assert.ok(closedCard.querySelector('[data-testid="unavailable-badge"]'));
  assert.match(closedCard.textContent, /Unavailable/);
});

test("selecting an open restaurant invokes onSelect with its id, a closed one cannot be selected", () => {
  const container = makeContainer();
  const selectedIds = [];
  renderResults(container, [OPEN_RESTAURANT, CLOSED_RESTAURANT], {
    doc: document,
    onSelect: (id) => selectedIds.push(id),
  });

  const openCard = container.querySelector('[data-restaurant-id="open-1"]');
  const closedCard = container.querySelector('[data-restaurant-id="closed-1"]');

  closedCard.click();
  assert.deepEqual(selectedIds, []);

  openCard.click();
  assert.deepEqual(selectedIds, ["open-1"]);
});

test("restaurant cards are keyboard accessible: Enter/Space select an open card, not a closed one", () => {
  const container = makeContainer();
  const selectedIds = [];
  renderResults(container, [OPEN_RESTAURANT, CLOSED_RESTAURANT], {
    doc: document,
    onSelect: (id) => selectedIds.push(id),
  });

  const openCard = container.querySelector('[data-restaurant-id="open-1"]');
  const closedCard = container.querySelector('[data-restaurant-id="closed-1"]');

  assert.equal(openCard.getAttribute("role"), "button");
  assert.equal(openCard.getAttribute("tabindex"), "0");
  assert.equal(openCard.getAttribute("aria-label"), "Open Burger");

  closedCard.dispatchEvent({ type: "keydown", key: "Enter" });
  closedCard.dispatchEvent({ type: "keydown", key: " " });
  assert.deepEqual(selectedIds, []);

  openCard.dispatchEvent({ type: "keydown", key: "Enter" });
  assert.deepEqual(selectedIds, ["open-1"]);

  openCard.dispatchEvent({ type: "keydown", key: " " });
  assert.deepEqual(selectedIds, ["open-1", "open-1"]);
});

test("closed restaurant cards expose an ARIA disabled state and are removed from the tab order", () => {
  const container = makeContainer();
  renderResults(container, [OPEN_RESTAURANT, CLOSED_RESTAURANT], { doc: document });

  const openCard = container.querySelector('[data-restaurant-id="open-1"]');
  const closedCard = container.querySelector('[data-restaurant-id="closed-1"]');

  assert.equal(openCard.hasAttribute("aria-disabled"), false);
  assert.equal(closedCard.getAttribute("aria-disabled"), "true");
  assert.equal(closedCard.getAttribute("tabindex"), "-1");
});

test("renderResults skips malformed restaurant entries instead of crashing", () => {
  const container = makeContainer();
  const malformed = { id: "bad-1", name: "Missing Fields" };

  renderResults(container, [OPEN_RESTAURANT, malformed], { doc: document });

  assert.equal(container.querySelectorAll('[data-testid="restaurant-card"]').length, 1);
  assert.ok(container.querySelector('[data-restaurant-id="open-1"]'));
});

test("renderError shows a plain error message with no restaurant cards", () => {
  const container = makeContainer();
  renderError(container, { doc: document });

  assert.ok(container.querySelector('[data-testid="search-error"]'));
  assert.equal(container.querySelectorAll('[data-testid="restaurant-card"]').length, 0);
});
