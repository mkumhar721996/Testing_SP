function paginate(items, { cursor = 0, pageSize }) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('pageSize must be a positive integer');
  }

  const start = Number.isInteger(cursor) && cursor > 0 ? cursor : 0;
  const page = items.slice(start, start + pageSize);
  const end = start + page.length;
  const nextCursor = end < items.length ? end : null;

  return { items: page, nextCursor };
}

module.exports = { paginate };
