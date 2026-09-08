'use strict';

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['New', 'In Progress', 'Resolved', 'Reopened', 'Closed'];
const TREND_WINDOW_DAYS = 30;

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysAgo(today, n) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
}

/**
 * 30 daily buckets (oldest first, today last) counting defects created that
 * day and defects closed (status=Closed, updated) that day. AC7.
 */
function computeTrend(defects, today = new Date()) {
  const buckets = [];
  for (let n = TREND_WINDOW_DAYS - 1; n >= 0; n--) {
    const key = dateKey(daysAgo(today, n));
    buckets.push({ date: key, created: 0, closed: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.date, b]));

  for (const defect of defects) {
    const createdKey = dateKey(defect.created);
    const createdBucket = byKey.get(createdKey);
    if (createdBucket) createdBucket.created += 1;

    if (defect.status === 'Closed') {
      const closedKey = dateKey(defect.updated);
      const closedBucket = byKey.get(closedKey);
      if (closedBucket) closedBucket.closed += 1;
    }
  }

  return buckets;
}

/** All-time count per severity level, in fixed order, zero counts included. AC1 / AC10. */
function computeSeverityBreakdown(defects) {
  return SEVERITIES.map((severity) => ({
    severity,
    count: defects.filter((d) => d.severity === severity).length,
  }));
}

/** All-time count per status, in fixed order, zero counts included. AC1 / AC10. */
function computeStatusBreakdown(defects) {
  return STATUSES.map((status) => ({
    status,
    count: defects.filter((d) => d.status === status).length,
  }));
}

function buildDashboardSummary(defects, today = new Date()) {
  return {
    trend: computeTrend(defects, today),
    severity: computeSeverityBreakdown(defects),
    status: computeStatusBreakdown(defects),
  };
}

module.exports = {
  SEVERITIES,
  STATUSES,
  computeTrend,
  computeSeverityBreakdown,
  computeStatusBreakdown,
  buildDashboardSummary,
};
