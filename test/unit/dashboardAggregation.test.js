'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeTrend,
  computeSeverityBreakdown,
  computeStatusBreakdown,
  buildDashboardSummary,
} = require('../../src/services/dashboardAggregation');

const TODAY = new Date(2026, 8, 8); // 8 Sep 2026, fixed reference point

function daysAgo(n) {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - n);
}

function isoKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// AC7: fixture spans 45 days — created/closed events both inside and outside the 30-day window.
function buildFortyFiveDaySpan() {
  const defects = [];
  for (let n = 0; n < 45; n++) {
    defects.push({
      id: 'DEF-created-' + n,
      title: 'created ' + n,
      severity: 'Low',
      status: 'New',
      created: daysAgo(n),
      updated: daysAgo(n),
    });
    defects.push({
      id: 'DEF-closed-' + n,
      title: 'closed ' + n,
      severity: 'Low',
      status: 'Closed',
      created: daysAgo(200), // created long before the window, only "closed" should count
      updated: daysAgo(n),
    });
  }
  return defects;
}

test('AC7: computeTrend returns exactly 30 daily buckets, oldest to newest', () => {
  const trend = computeTrend(buildFortyFiveDaySpan(), TODAY);
  assert.equal(trend.length, 30);
  assert.equal(trend[0].date, isoKey(daysAgo(29)));
  assert.equal(trend[29].date, isoKey(daysAgo(0)));
});

test('AC7: each bucket counts only defects created/closed on that exact day', () => {
  const trend = computeTrend(buildFortyFiveDaySpan(), TODAY);
  const bucketFor10DaysAgo = trend.find((b) => b.date === isoKey(daysAgo(10)));
  assert.equal(bucketFor10DaysAgo.created, 1);
  assert.equal(bucketFor10DaysAgo.closed, 1);
});

test('AC7: nothing outside the 30-day window is counted', () => {
  const trend = computeTrend(buildFortyFiveDaySpan(), TODAY);
  const totalCreated = trend.reduce((sum, b) => sum + b.created, 0);
  const totalClosed = trend.reduce((sum, b) => sum + b.closed, 0);
  // Only days 0..29 ago fall inside the window (30 of the 45 created, 30 of the 45 closed).
  assert.equal(totalCreated, 30);
  assert.equal(totalClosed, 30);
});

test('AC10: computeTrend on an empty defect list still returns 30 zero-valued buckets', () => {
  const trend = computeTrend([], TODAY);
  assert.equal(trend.length, 30);
  assert.ok(trend.every((b) => b.created === 0 && b.closed === 0));
});

test('AC1: computeSeverityBreakdown returns one entry per severity level, in fixed order', () => {
  const defects = [
    { id: '1', severity: 'Critical', status: 'New' },
    { id: '2', severity: 'Critical', status: 'New' },
    { id: '3', severity: 'Medium', status: 'New' },
  ];
  const breakdown = computeSeverityBreakdown(defects);
  assert.deepEqual(breakdown.map((b) => b.severity), ['Critical', 'High', 'Medium', 'Low']);
  assert.equal(breakdown.find((b) => b.severity === 'Critical').count, 2);
  assert.equal(breakdown.find((b) => b.severity === 'Medium').count, 1);
});

test('AC10: computeSeverityBreakdown includes explicit zero counts, not omitted entries', () => {
  const breakdown = computeSeverityBreakdown([]);
  assert.equal(breakdown.length, 4);
  assert.ok(breakdown.every((b) => b.count === 0));
});

test('AC1: computeStatusBreakdown returns one entry per status, in fixed order', () => {
  const defects = [
    { id: '1', severity: 'Low', status: 'Closed' },
    { id: '2', severity: 'Low', status: 'New' },
  ];
  const breakdown = computeStatusBreakdown(defects);
  assert.deepEqual(breakdown.map((b) => b.status), ['New', 'In Progress', 'Resolved', 'Reopened', 'Closed']);
  assert.equal(breakdown.find((b) => b.status === 'Closed').count, 1);
});

test('AC10: computeStatusBreakdown includes explicit zero counts, not omitted entries', () => {
  const breakdown = computeStatusBreakdown([]);
  assert.equal(breakdown.length, 5);
  assert.ok(breakdown.every((b) => b.count === 0));
});

test('buildDashboardSummary composes trend + severity + status for the full defect set', () => {
  const summary = buildDashboardSummary(buildFortyFiveDaySpan(), TODAY);
  assert.ok(Array.isArray(summary.trend));
  assert.ok(Array.isArray(summary.severity));
  assert.ok(Array.isArray(summary.status));
  assert.equal(summary.trend.length, 30);
});
