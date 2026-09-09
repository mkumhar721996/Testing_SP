const MATCH_SCORE = {
  NONE: 0,
  CONTAINS: 1,
  STARTS_WITH: 2,
  EXACT: 3,
};

function scoreField(value, query) {
  const field = value.toLowerCase();
  const term = query.toLowerCase();
  if (!term) return MATCH_SCORE.NONE;
  if (field === term) return MATCH_SCORE.EXACT;
  if (field.startsWith(term)) return MATCH_SCORE.STARTS_WITH;
  if (field.includes(term)) return MATCH_SCORE.CONTAINS;
  return MATCH_SCORE.NONE;
}

export function rankRestaurants(restaurants, query) {
  return restaurants
    .map((restaurant) => ({
      restaurant,
      score: Math.max(scoreField(restaurant.name, query), scoreField(restaurant.cuisine, query)),
    }))
    .filter((entry) => entry.score > MATCH_SCORE.NONE)
    .sort((a, b) => b.score - a.score || b.restaurant.rating - a.restaurant.rating)
    .map((entry) => entry.restaurant);
}
