'use strict';

/**
 * Deterministic seed defects, mirroring the approved prototype's
 * buildSeedDefects() (same titles/severity/status distribution and
 * date math) so the app's default dataset matches the design exactly.
 */
const TITLES = [
  'Login button unresponsive on Safari 17', 'Export to CSV truncates final row',
  'Null pointer thrown on empty cart checkout', 'Session times out mid-edit without warning',
  'Search results skip page 3 of pagination', 'Password reset email delayed over an hour',
  'Dark mode text fails WCAG AA contrast', 'File upload rejects filenames over 100 characters',
  'Duplicate invoice numbers generated under load', 'Timezone offset incorrect for UTC-5 accounts',
  'Report totals mismatch after partial refund', 'Dropdown menu clipped on 375px viewport',
  'Bulk delete shows confirmation dialog twice', 'API returns 500 on empty JSON payload',
  'Notification badge count never clears', 'Currency rounding error on tax calculation',
  'Password reset link 404s from email client', 'Chart legend overlaps series on narrow screens',
  'Autosave silently fails after network blip', 'Comment thread order reverses on page refresh',
  'CSV import ignores rows with trailing whitespace', 'Sidebar collapses unexpectedly on window resize',
  'Two-factor code rejected on first valid attempt', 'Date picker allows selecting past cutoff date',
  'Avatar upload rotates portrait images 90 degrees', 'Webhook retries duplicate the original event',
  'Inline edit loses unsaved changes on tab switch', 'Table sort resets after applying a filter',
  'PDF export omits the last table column', 'Search autocomplete freezes on rapid typing',
  'User role change not reflected until re-login', 'Email digest sent twice for the same event',
  'Keyboard focus trapped inside closed modal', 'Archived records reappear after cache refresh',
  'Slack integration drops messages over 500 chars', 'Currency symbol missing on invoice PDF',
  'Drag-and-drop reorder fails on touch devices', 'Bulk export times out for large data sets',
  'Tooltip text overflows container on hover', 'Login attempts not rate-limited after 10 tries',
  'Custom field values lost on record duplication', 'Calendar view misaligns events across DST change',
  'Audit log missing entries for admin deletions', 'Search filter chips cannot be removed individually',
  'Print stylesheet cuts off right-most column', 'Session cookie not marked Secure in production',
  'Batch status update skips the last selected row', 'Broken image icon shown for deleted attachments',
  'Form validation error persists after correction', 'Multi-select checkbox state resets on scroll',
];

const { SEVERITIES, STATUSES } = require('../services/dashboardAggregation');
const SEVERITY_COUNTS = { Critical: 9, High: 15, Medium: 26, Low: 0 };
const STATUS_COUNTS = { New: 8, 'In Progress': 12, Resolved: 10, Reopened: 4, Closed: 16 };
const COMPONENTS = ['Checkout', 'Auth', 'Reporting', 'Notifications', 'Import/Export', 'Billing'];
const REPORTERS = ['A. Chen', 'J. Lee', 'M. Torres', 'S. Patel', 'R. Kim'];

function daysAgoDate(today, n) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
}

function permute(arr, seedMul) {
  const n = arr.length;
  const order = arr.map((v, i) => ({ i, key: (i * seedMul) % n }));
  order.sort((a, b) => a.key - b.key);
  return order.map((o) => arr[o.i]);
}

function buildSeedDefects(today = new Date()) {
  const severityPool = [];
  SEVERITIES.forEach((s) => { for (let k = 0; k < SEVERITY_COUNTS[s]; k++) severityPool.push(s); });
  const statusPool = [];
  STATUSES.forEach((s) => { for (let k = 0; k < STATUS_COUNTS[s]; k++) statusPool.push(s); });
  const severityShuffled = permute(severityPool, 7);
  const statusShuffled = permute(statusPool, 13);

  return TITLES.map((title, i) => {
    const severity = severityShuffled[i];
    const status = statusShuffled[i];
    const createdDaysAgo = (i * 7 + 2) % 30;
    let updatedDaysAgo;
    if (status === 'Closed' || status === 'Resolved') {
      updatedDaysAgo = Math.max(0, createdDaysAgo - ((i % 6) + 1));
    } else if (status === 'New') {
      updatedDaysAgo = createdDaysAgo;
    } else {
      updatedDaysAgo = Math.max(0, createdDaysAgo - (i % 3));
    }
    return {
      id: 'DEF-' + (1001 + i),
      title,
      severity,
      status,
      created: daysAgoDate(today, createdDaysAgo),
      updated: daysAgoDate(today, updatedDaysAgo),
      component: COMPONENTS[i % COMPONENTS.length],
      reportedBy: REPORTERS[i % REPORTERS.length],
    };
  });
}

module.exports = { buildSeedDefects };
