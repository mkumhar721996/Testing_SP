(function () {
  'use strict';

  var SEVERITY_CHIP = { Critical: 'chip-sev-critical', High: 'chip-sev-high', Medium: 'chip-sev-medium', Low: 'chip-sev-low' };
  var STATUS_CHIP = { 'New': 'chip-status-new', 'In Progress': 'chip-status-progress', 'Resolved': 'chip-status-resolved', 'Reopened': 'chip-status-reopened', 'Closed': 'chip-status-closed' };

  var state = { selection: null, label: '', sortKey: 'created', sortDir: 'desc', page: 1, lastResult: null };

  function fmtPretty(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function open(selection, label) {
    state.selection = selection;
    state.label = label;
    state.sortKey = 'created';
    state.sortDir = 'desc';
    state.page = 1;
    window.DefectDashboard.showScreen('drill');
    await load();
  }

  async function load() {
    var result = await window.DefectDashboardApi.fetchDefects({
      selection: state.selection,
      sortKey: state.sortKey,
      sortDir: state.sortDir,
      page: state.page,
    });
    state.lastResult = result;
    render(result);
  }

  function onSortClick(key) {
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = 'asc';
    }
    state.page = 1;
    load();
  }

  function goToPage(page) {
    state.page = page;
    load();
  }

  function render(result) {
    document.getElementById('drillTitle').textContent = 'Filtered defects — ' + state.label;
    var total = result.total;
    document.getElementById('drillCount').textContent = total + (total === 1 ? ' defect' : ' defects');

    document.querySelectorAll('#drillTable th.sortable').forEach(function (th) {
      var key = th.getAttribute('data-key');
      var indicator = th.querySelector('.sort-indicator');
      if (key === state.sortKey) {
        th.classList.add('is-active');
        indicator.textContent = state.sortDir === 'asc' ? '▲' : '▼';
      } else {
        th.classList.remove('is-active');
        indicator.textContent = '';
      }
    });

    var tbody = document.getElementById('drillTbody');
    tbody.innerHTML = '';

    if (result.rows.length === 0) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="6"><div class="empty-state"><span class="empty-icon">◫</span>' +
        '<strong>No defects match this selection</strong>' +
        '<span class="text-xs">There are currently no defects for “' + state.label + '”.</span></div></td>';
      tbody.appendChild(tr);
      document.getElementById('drillPagination').innerHTML = '';
      return;
    }

    result.rows.forEach(function (d) {
      var row = document.createElement('tr');
      row.className = 'data-row';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', 'Inspect ' + d.id + ' (read-only)');
      row.addEventListener('click', function () { openDetailModal(d); });
      row.addEventListener('keydown', function (e) { if (e.key === 'Enter') openDetailModal(d); });
      row.innerHTML =
        '<td class="cell-id">' + d.id + '</td>' +
        '<td>' + d.title + '</td>' +
        '<td><span class="chip ' + SEVERITY_CHIP[d.severity] + '">' + d.severity + '</span></td>' +
        '<td><span class="chip ' + STATUS_CHIP[d.status] + '">' + d.status + '</span></td>' +
        '<td>' + fmtPretty(d.created) + '</td>' +
        '<td>' + fmtPretty(d.updated) + '</td>';
      tbody.appendChild(row);
    });

    renderPagination(result);
  }

  function renderPagination(result) {
    var pag = document.getElementById('drillPagination');
    var buttons = Pagination.computePageButtons(result.page, result.totalPages);
    if (buttons.length === 0) {
      pag.innerHTML = '';
      return;
    }
    var start = (result.page - 1) * result.pageSize + 1;
    var end = Math.min(result.total, result.page * result.pageSize);
    var html = '<span class="text-xs text-muted">Showing ' + start + '–' + end + ' of ' + result.total + '</span><div class="page-buttons">';
    buttons.forEach(function (b) {
      html += '<button class="page-btn ' + (b.isActive ? 'is-active' : '') + '" data-page="' + b.page + '" ' + (b.disabled ? 'disabled' : '') + '>' + b.label + '</button>';
    });
    html += '</div>';
    pag.innerHTML = html;
    pag.querySelectorAll('.page-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { goToPage(parseInt(btn.getAttribute('data-page'), 10)); });
    });
  }

  function openDetailModal(d) {
    document.getElementById('modalTitle').textContent = d.id;
    document.getElementById('modalBody').innerHTML =
      '<div class="field-row"><span class="field-label">Title</span><span class="field-value">' + d.title + '</span></div>' +
      '<div class="field-pair">' +
        '<div class="field-row"><span class="field-label">Severity</span><span class="field-value"><span class="chip ' + SEVERITY_CHIP[d.severity] + '">' + d.severity + '</span></span></div>' +
        '<div class="field-row"><span class="field-label">Status</span><span class="field-value"><span class="chip ' + STATUS_CHIP[d.status] + '">' + d.status + '</span></span></div>' +
      '</div>' +
      '<div class="field-pair">' +
        '<div class="field-row"><span class="field-label">Created</span><span class="field-value">' + fmtPretty(d.created) + '</span></div>' +
        '<div class="field-row"><span class="field-label">Updated</span><span class="field-value">' + fmtPretty(d.updated) + '</span></div>' +
      '</div>';
    document.getElementById('modalOverlay').hidden = false;
  }

  function closeModal() {
    document.getElementById('modalOverlay').hidden = true;
  }

  window.DrillThrough = { open: open, onSortClick: onSortClick, goToPage: goToPage, closeModal: closeModal };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('#drillTable th.sortable').forEach(function (th) {
        th.addEventListener('click', function () { onSortClick(th.getAttribute('data-key')); });
      });
      document.getElementById('drillBackBtn').addEventListener('click', function () {
        window.DefectDashboard.showScreen('dashboard');
      });
      document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
      document.getElementById('modalCloseIconBtn').addEventListener('click', closeModal);
    });
  }
})();
