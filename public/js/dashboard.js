(function () {
  'use strict';

  var SEVERITY_VAR = { Critical: '--color-sev-critical', High: '--color-sev-high', Medium: '--color-sev-medium', Low: '--color-sev-low' };
  var STATUS_VAR = { 'New': '--color-stat-new', 'In Progress': '--color-stat-progress', 'Resolved': '--color-stat-resolved', 'Reopened': '--color-stat-reopened', 'Closed': '--color-stat-closed' };

  function keyToPretty(key) {
    var p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function showScreen(domId) {
    document.querySelectorAll('.screen').forEach(function (s) { s.hidden = true; });
    document.getElementById('screen-' + domId).hidden = false;
  }

  function renderTrendChart(buckets) {
    var container = document.getElementById('trendChartBody');
    var emptyState = document.getElementById('trendEmptyState');
    container.innerHTML = '';
    var total = buckets.reduce(function (sum, b) { return sum + b.created + b.closed; }, 0);
    emptyState.hidden = total > 0;
    var max = ChartLayout.maxOf(buckets.reduce(function (acc, b) { return acc.concat(b.created, b.closed); }, []));

    buckets.forEach(function (b, idx) {
      var col = document.createElement('div');
      col.className = 'trend-col';
      var bars = document.createElement('div');
      bars.className = 'trend-bars';

      var createdBtn = document.createElement('button');
      createdBtn.className = 'trend-bar created';
      createdBtn.style.height = ChartLayout.barHeightPx(b.created, max, 118) + 'px';
      createdBtn.title = keyToPretty(b.date) + ' — Created: ' + b.created;
      createdBtn.setAttribute('aria-label', 'Defects created on ' + keyToPretty(b.date) + ': ' + b.created);
      createdBtn.disabled = ChartLayout.shouldDisable(b.created);
      createdBtn.addEventListener('click', function () {
        window.DrillThrough.open({ type: 'createdOnDay', value: b.date }, 'Created on ' + keyToPretty(b.date));
      });

      var closedBtn = document.createElement('button');
      closedBtn.className = 'trend-bar closed';
      closedBtn.style.height = ChartLayout.barHeightPx(b.closed, max, 118) + 'px';
      closedBtn.title = keyToPretty(b.date) + ' — Closed: ' + b.closed;
      closedBtn.setAttribute('aria-label', 'Defects closed on ' + keyToPretty(b.date) + ': ' + b.closed);
      closedBtn.disabled = ChartLayout.shouldDisable(b.closed);
      closedBtn.addEventListener('click', function () {
        window.DrillThrough.open({ type: 'closedOnDay', value: b.date }, 'Closed on ' + keyToPretty(b.date));
      });

      bars.appendChild(createdBtn);
      bars.appendChild(closedBtn);
      col.appendChild(bars);

      if (idx % 5 === 0 || idx === buckets.length - 1) {
        var tick = document.createElement('div');
        tick.className = 'trend-tick';
        tick.textContent = keyToPretty(b.date);
        col.appendChild(tick);
      }
      container.appendChild(col);
    });
  }

  function renderSeverityChart(rows) {
    var container = document.getElementById('severityChartBody');
    var emptyState = document.getElementById('severityEmptyState');
    container.innerHTML = '';
    var total = rows.reduce(function (sum, r) { return sum + r.count; }, 0);
    emptyState.hidden = total > 0;
    var max = ChartLayout.maxOf(rows.map(function (r) { return r.count; }));

    // Severity rows stay clickable even at a zero count (unlike trend/status
    // bars) so a manager can still reach the empty drill-through state.
    rows.forEach(function (r) {
      var row = document.createElement('button');
      row.className = 'severity-row';
      row.setAttribute('aria-label', 'Severity ' + r.severity + ': ' + r.count + ' defects');
      row.addEventListener('click', function () {
        window.DrillThrough.open({ type: 'severity', value: r.severity }, 'Severity: ' + r.severity);
      });
      row.innerHTML =
        '<span class="severity-name"><span class="dot" style="background:var(' + SEVERITY_VAR[r.severity] + ')"></span>' + r.severity + '</span>' +
        '<span class="severity-track"><span class="severity-fill" style="width:' + Math.round((r.count / max) * 100) + '%;background:var(' + SEVERITY_VAR[r.severity] + ')"></span></span>' +
        '<span class="severity-count">' + r.count + '</span>';
      container.appendChild(row);
    });
  }

  function renderStatusChart(rows) {
    var container = document.getElementById('statusChartBody');
    var emptyState = document.getElementById('statusEmptyState');
    container.innerHTML = '';
    var total = rows.reduce(function (sum, r) { return sum + r.count; }, 0);
    emptyState.hidden = total > 0;
    var max = ChartLayout.maxOf(rows.map(function (r) { return r.count; }));

    rows.forEach(function (r) {
      var col = document.createElement('div');
      col.className = 'status-col';
      var btn = document.createElement('button');
      btn.className = 'status-bar';
      btn.style.height = ChartLayout.barHeightPx(r.count, max, 110, 3) + 'px';
      btn.style.background = 'var(' + STATUS_VAR[r.status] + ')';
      btn.setAttribute('aria-label', 'Status ' + r.status + ': ' + r.count + ' defects');
      btn.disabled = ChartLayout.shouldDisable(r.count);
      btn.addEventListener('click', function () {
        window.DrillThrough.open({ type: 'status', value: r.status }, 'Status: ' + r.status);
      });
      var countLabel = document.createElement('div');
      countLabel.className = 'status-count';
      countLabel.textContent = r.count;
      var label = document.createElement('div');
      label.className = 'status-label';
      label.textContent = r.status;
      col.appendChild(countLabel);
      col.appendChild(btn);
      col.appendChild(label);
      container.appendChild(col);
    });
  }

  function renderDashboard(summary) {
    renderTrendChart(summary.trend);
    renderSeverityChart(summary.severity);
    renderStatusChart(summary.status);
  }

  async function init() {
    try {
      // Fetched exactly once, on page load — no polling/interval, which is
      // what makes AC9 true by construction (no reload = no data change).
      var summary = await window.DefectDashboardApi.fetchSummary();
      renderDashboard(summary);
      showScreen('dashboard');
    } catch (err) {
      if (err && err.status === 403) {
        showScreen('access-denied');
      } else {
        throw err;
      }
    }
  }

  window.DefectDashboard = { showScreen: showScreen, renderDashboard: renderDashboard, init: init };

  if (typeof document !== 'undefined' && !window.__DEFECT_DASHBOARD_SKIP_INIT__) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
