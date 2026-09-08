'use strict';

const PAGE_SIZE = 25;
const SORTABLE_KEYS = ['id', 'title', 'severity', 'status', 'created', 'updated'];

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** Parses either an ISO 'YYYY-MM-DD' key or a loose 'YYYY-M-D' key into a canonical form. */
function normalizeDayKey(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/** The four selection types the dashboard's chart clicks can produce. AC2. */
function matchesSelection(defect, selection) {
  if (!selection) return true;
  switch (selection.type) {
    case 'severity':
      return defect.severity === selection.value;
    case 'status':
      return defect.status === selection.value;
    case 'createdOnDay':
      return dateKey(defect.created) === normalizeDayKey(selection.value);
    case 'closedOnDay':
      return defect.status === 'Closed' && dateKey(defect.updated) === normalizeDayKey(selection.value);
    default:
      return true;
  }
}

function compareRows(a, b, sortKey, sortDir) {
  const dir = sortDir === 'asc' ? 1 : -1;
  let av = a[sortKey];
  let bv = b[sortKey];
  if (sortKey === 'created' || sortKey === 'updated') {
    av = av.getTime();
    bv = bv.getTime();
  } else {
    av = String(av).toLowerCase();
    bv = String(bv).toLowerCase();
  }
  if (av < bv) return -1 * dir;
  if (av > bv) return 1 * dir;
  return 0;
}

/**
 * Filters defects by a single chart-driven selection, sorts (default: created
 * desc, AC11/AC12), and paginates at a fixed page size of 25 (AC13).
 */
function queryDefects(defects, options = {}) {
  const sortKey = SORTABLE_KEYS.includes(options.sortKey) ? options.sortKey : 'created';
  let sortDir = options.sortDir === 'asc' || options.sortDir === 'desc' ? options.sortDir : undefined;
  if (!sortDir) sortDir = options.sortKey ? 'asc' : 'desc';
  const page = Math.max(1, options.page || 1);

  const matched = defects.filter((d) => matchesSelection(d, options.selection));
  const sorted = matched.slice().sort((a, b) => compareRows(a, b, sortKey, sortDir));

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  return { rows, total, page: currentPage, totalPages, pageSize: PAGE_SIZE, sortKey, sortDir };
}

module.exports = { queryDefects, PAGE_SIZE, SORTABLE_KEYS };
