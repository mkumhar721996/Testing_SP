import test from "node:test";
import assert from "node:assert/strict";
import { document } from "../../test-utils/domShim.js";
import { initDiscoveryController } from "../../src/web/discovery/discoveryController.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

const BURGER_BARN = {
  id: "r1",
  name: "Burger Barn",
  cuisine: "American",
  rating: 4.5,
  estimatedDeliveryMinutes: 20,
  deliveryFeeCents: 199,
  isOpen: true,
};

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
  await flushMicrotasks();

  assert.ok(resultsEl.querySelector('[data-testid="loading-indicator"]'));
  assert.equal(resultsEl.querySelector('[data-testid="restaurant-card"]'), null);

  fetchDeferred.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [BURGER_BARN] }),
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
    fetchImpl: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) }),
    doc: document,
  });

  inputEl.value = "zzz-no-match";
  formEl.dispatchEvent({ type: "submit" });

  await flushMicrotasks();

  assert.ok(resultsEl.querySelector('[data-testid="no-results"]'));
  assert.equal(resultsEl.querySelector('[data-testid="restaurant-card"]'), null);
});

test("does not submit a search for an empty or whitespace-only query", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();
  let fetchCalls = 0;

  initDiscoveryController({
    formEl,
    inputEl,
    resultsEl,
    fetchImpl: () => {
      fetchCalls += 1;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
    },
    doc: document,
  });

  inputEl.value = "   ";
  formEl.dispatchEvent({ type: "submit" });
  await flushMicrotasks();

  assert.equal(fetchCalls, 0);
  assert.equal(resultsEl.querySelector('[data-testid="loading-indicator"]'), null);
});

test("shows an error message when the search request fails over the network", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();

  initDiscoveryController({
    formEl,
    inputEl,
    resultsEl,
    fetchImpl: () => Promise.reject(new Error("network down")),
    doc: document,
  });

  inputEl.value = "burger";
  formEl.dispatchEvent({ type: "submit" });
  await flushMicrotasks();

  assert.ok(resultsEl.querySelector('[data-testid="search-error"]'));
  assert.equal(resultsEl.querySelector('[data-testid="loading-indicator"]'), null);
});

test("shows an error message when the server responds with a non-OK status", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();

  initDiscoveryController({
    formEl,
    inputEl,
    resultsEl,
    fetchImpl: () =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    doc: document,
  });

  inputEl.value = "burger";
  formEl.dispatchEvent({ type: "submit" });
  await flushMicrotasks();

  assert.ok(resultsEl.querySelector('[data-testid="search-error"]'));
});

test("cancels a stale in-flight request when a new search is submitted before it resolves", async () => {
  const { formEl, inputEl, resultsEl } = buildForm();
  const firstRequest = deferred();
  const signals = [];

  const fetchImpl = (url, { signal }) => {
    signals.push(signal);
    if (signals.length === 1) {
      signal.addEventListener("abort", () => {
        const abortError = new Error("aborted");
        abortError.name = "AbortError";
        firstRequest.reject(abortError);
      });
      return firstRequest.promise;
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ ...BURGER_BARN, id: "r2", name: "Sushi Circle", cuisine: "Japanese" }],
        }),
    });
  };

  initDiscoveryController({ formEl, inputEl, resultsEl, fetchImpl, doc: document });

  inputEl.value = "burger";
  formEl.dispatchEvent({ type: "submit" });

  inputEl.value = "sushi";
  formEl.dispatchEvent({ type: "submit" });

  assert.ok(signals[0].aborted);

  await flushMicrotasks();

  assert.equal(resultsEl.querySelector('[data-testid="loading-indicator"]'), null);
  assert.equal(resultsEl.querySelector('[data-testid="search-error"]'), null);
  const card = resultsEl.querySelector('[data-testid="restaurant-card"]');
  assert.ok(card);
  assert.match(card.textContent, /Sushi Circle/);
});
