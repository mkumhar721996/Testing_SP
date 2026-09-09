import test from "node:test";
import assert from "node:assert/strict";
import { document } from "../../test-utils/domShim.js";
import { initDiscoveryController } from "../../src/web/discovery/discoveryController.js";

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

function buildForm() {
  const formEl = document.createElement("form");
  const inputEl = document.createElement("input");
  const resultsEl = document.createElement("div");
  formEl.appendChild(inputEl);
  return { formEl, inputEl, resultsEl };
}

test("shows a loading indicator while the fetch is pending, then renders results once it resolves", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();
  const fetchDeferred = deferred();

  initDiscoveryController({
    formEl,
    inputEl,
    resultsEl,
    fetchImpl: () => fetchDeferred.promise,
    doc: document,
  });

  inputEl.value = "burger";
  formEl.dispatchEvent({ type: "submit" });

  assert.ok(resultsEl.querySelector('[data-testid="loading-indicator"]'));
  assert.equal(resultsEl.querySelector('[data-testid="restaurant-card"]'), null);

  fetchDeferred.resolve({
    json: () =>
      Promise.resolve({
        results: [
          {
            id: "r1",
            name: "Burger Barn",
            cuisine: "American",
            rating: 4.5,
            estimatedDeliveryMinutes: 20,
            deliveryFeeCents: 199,
            isOpen: true,
          },
        ],
      }),
  });

  await flushMicrotasks();

  assert.equal(resultsEl.querySelector('[data-testid="loading-indicator"]'), null);
  assert.ok(resultsEl.querySelector('[data-testid="restaurant-card"]'));
});

test("shows a no-results message when the search returns no matches", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();

  initDiscoveryController({
    formEl,
    inputEl,
    resultsEl,
    fetchImpl: () => Promise.resolve({ json: () => Promise.resolve({ results: [] }) }),
    doc: document,
  });

  inputEl.value = "zzz-no-match";
  formEl.dispatchEvent({ type: "submit" });

  await flushMicrotasks();

  assert.ok(resultsEl.querySelector('[data-testid="no-results"]'));
  assert.equal(resultsEl.querySelector('[data-testid="restaurant-card"]'), null);
});
