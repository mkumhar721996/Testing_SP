import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDefectDetail } from './DefectDetail.js';

function baseDefect(overrides = {}) {
  return {
    id: 'DEF-1042',
    title: 'Login button unresponsive on Safari 17',
    severity: 'High',
    component: 'Auth / Web',
    reporter: 'Alicia Gomez (Tester)',
    assignee: 'Priya Patel (Developer)',
    created: 'Sep 2, 2026',
    status: 'open',
    statusHistory: [
      { actor: 'Alicia Gomez', from: null, to: 'open', timestamp: '2026-09-02T00:00:00.000Z' },
    ],
    ...overrides,
  };
}

function actionButtons(html) {
  return [...html.matchAll(/<button class="btn btn-primary btn-sm" data-action="([a-z]+)">([^<]+)<\/button>/g)];
}

test('AC1: developer viewing an Open defect sees exactly one enabled action, Mark as Fixed', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'open' }), role: 'developer' });
  const buttons = actionButtons(html);
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0][1], 'fixed');
  assert.equal(buttons[0][2], 'Mark as Fixed');
});

test('AC2: developer viewing a Fixed defect sees exactly one enabled action, Reopen for Development', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'fixed' }), role: 'developer' });
  const buttons = actionButtons(html);
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0][1], 'open');
  assert.equal(buttons[0][2], 'Reopen for Development');
});

test('AC3: tester viewing a Fixed defect sees exactly Close and Re-open, nothing else', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'fixed' }), role: 'tester' });
  const buttons = actionButtons(html);
  const ids = buttons.map((b) => b[1]).sort();
  assert.deepEqual(ids, ['closed', 'reopened']);
  const labels = buttons.map((b) => b[2]).sort();
  assert.deepEqual(labels, ['Close', 'Re-open']);
});

test('AC4: tester viewing a Closed defect sees only Re-open', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'closed' }), role: 'tester' });
  const buttons = actionButtons(html);
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0][1], 'reopened');
  assert.equal(buttons[0][2], 'Re-open');
});

test('AC5: tester viewing a Re-opened defect sees only Mark as Fixed', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'reopened' }), role: 'tester' });
  const buttons = actionButtons(html);
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0][1], 'fixed');
  assert.equal(buttons[0][2], 'Mark as Fixed');
});

test('AC6: an Open defect never renders Close or Re-open, regardless of role', () => {
  for (const role of ['developer', 'tester', 'manager']) {
    const html = renderDefectDetail({ defect: baseDefect({ status: 'open' }), role });
    const ids = actionButtons(html).map((b) => b[1]);
    assert.ok(!ids.includes('closed'));
    assert.ok(!ids.includes('reopened'));
  }
});

test('AC7: a manager viewing any status renders zero action buttons and the no-actions fallback copy', () => {
  for (const status of ['open', 'fixed', 'closed', 'reopened']) {
    const html = renderDefectDetail({ defect: baseDefect({ status }), role: 'manager' });
    assert.equal(actionButtons(html).length, 0);
    assert.match(
      html,
      /<p class="no-actions">Status transitions are performed by Developers and Testers\. No actions are available to your role\.<\/p>/,
    );
  }
});

test('the status badge reflects the current status and uses the design token chip class', () => {
  const html = renderDefectDetail({ defect: baseDefect({ status: 'fixed' }), role: 'developer' });
  assert.match(html, /<span class="chip chip-warning status-badge">Fixed<\/span>/);
});

test('security: a defect id containing a quote cannot break out of the data-defect-id attribute', () => {
  const maliciousId = 'DEF-1" onclick="alert(1)';
  const html = renderDefectDetail({ defect: baseDefect({ id: maliciousId }), role: 'developer' });
  assert.doesNotMatch(html, /data-defect-id="DEF-1" onclick=/);
  assert.match(html, /data-defect-id="DEF-1&quot; onclick=&quot;alert\(1\)"/);
});

test('security: reporter/assignee/created values with quotes or apostrophes are escaped, not injected raw', () => {
  const html = renderDefectDetail({
    defect: baseDefect({ reporter: `Mallory" onmouseover="alert('xss')` }),
    role: 'developer',
  });
  assert.doesNotMatch(html, /onmouseover="alert/);
  assert.match(html, /Mallory&quot; onmouseover=&quot;alert\(&#39;xss&#39;\)/);
});

test('AC9: the previous status label is not shown as the current status badge after a status change', () => {
  const openHtml = renderDefectDetail({ defect: baseDefect({ status: 'open' }), role: 'developer' });
  assert.match(openHtml, /<span class="chip status-badge">Open<\/span>/);

  const fixedHtml = renderDefectDetail({ defect: baseDefect({ status: 'fixed' }), role: 'developer' });
  assert.doesNotMatch(fixedHtml, /<span class="chip status-badge">Open<\/span>/);
  assert.match(fixedHtml, /<span class="chip chip-warning status-badge">Fixed<\/span>/);
});
