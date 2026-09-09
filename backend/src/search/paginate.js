// `windowItems` is a pre-fetched window starting at `cursor`, containing up to `pageSize + 1`
// items (the caller — e.g. a route handler backed by a database — is expected to fetch that
// window itself, via LIMIT/OFFSET or equivalent, rather than materializing the full result set).
// The extra (+1) item, when present, is how a page cap is enforced without a separate total
// count: if the window holds more than `pageSize` items, there is a next page.
function paginate(windowItems, { cursor = 0, pageSize }) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('pageSize must be a positive integer');
  }

  const start = Number.isInteger(cursor) && cursor > 0 ? cursor : 0;
  const hasMore = windowItems.length > pageSize;
  const items = hasMore ? windowItems.slice(0, pageSize) : windowItems;
  const nextCursor = hasMore ? start + pageSize : null;

  return { items, nextCursor };
}

module.exports = { paginate };
