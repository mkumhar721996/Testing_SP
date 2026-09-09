const PREDICATES = {
  minRating: (restaurant, value) => restaurant.rating >= value,
  maxEstimatedDeliveryMinutes: (restaurant, value) => restaurant.estimatedDeliveryMinutes <= value,
  maxDeliveryFeeCents: (restaurant, value) => restaurant.deliveryFeeCents <= value,
};

export function filterSearchResults(results, filters = {}) {
  const activeEntries = Object.entries(filters).filter(([, value]) => value != null);

  if (activeEntries.length === 0) {
    return results;
  }

  return results.filter((restaurant) =>
    activeEntries.every(([key, value]) => PREDICATES[key](restaurant, value))
  );
}
