import test from "node:test";
import assert from "node:assert/strict";
import { rankRestaurants } from "../../../src/server/search/rankRestaurants.js";

test("ranks an exact name match above a starts-with match above a contains match", () => {
  const restaurants = [
    { id: "1", name: "Zesty Burgers", cuisine: "American", rating: 5.0 },
    { id: "2", name: "Burger", cuisine: "American", rating: 3.0 },
    { id: "3", name: "Burgerholic", cuisine: "American", rating: 4.0 },
  ];

  const ranked = rankRestaurants(restaurants, "Burger");

  assert.deepEqual(
    ranked.map((r) => r.id),
    ["2", "3", "1"],
  );
});

test("matches on the cuisine field as well as the name field", () => {
  const restaurants = [
    { id: "x", name: "Taco Town", cuisine: "Mexican", rating: 4.0 },
    { id: "y", name: "Sushi Circle", cuisine: "Japanese", rating: 4.8 },
  ];

  const ranked = rankRestaurants(restaurants, "Mexican");

  assert.deepEqual(
    ranked.map((r) => r.id),
    ["x"],
  );
});

test("uses rating as a tiebreaker when match quality is equal", () => {
  const restaurants = [
    { id: "a", name: "Sushi Circle", cuisine: "Japanese", rating: 4.2 },
    { id: "b", name: "Sushi Express", cuisine: "Japanese", rating: 4.8 },
  ];

  const ranked = rankRestaurants(restaurants, "Sushi");

  assert.deepEqual(
    ranked.map((r) => r.id),
    ["b", "a"],
  );
});

test("excludes restaurants that do not match the query at all", () => {
  const restaurants = [{ id: "1", name: "Sushi Circle", cuisine: "Japanese", rating: 4.0 }];

  const ranked = rankRestaurants(restaurants, "burger");

  assert.deepEqual(ranked, []);
});

test("returns no results for an empty or whitespace-only query (the discovery controller does not submit one)", () => {
  const restaurants = [{ id: "1", name: "Sushi Circle", cuisine: "Japanese", rating: 4.0 }];

  assert.deepEqual(rankRestaurants(restaurants, ""), []);
  assert.deepEqual(rankRestaurants(restaurants, "   "), []);
});
