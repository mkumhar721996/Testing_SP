import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefectRepository } from '../domain/defectRepository.js';
import { handleStatusTransitionRequest } from './defectStatusRoute.js';

function makeRepo() {
  return createDefectRepository([
    {
      id: 'DEF-1042',
      status: 'open',
      statusHistory: [{ actor: 'Alicia Gomez', from: null, to: 'open', timestamp: '2026-09-02T00:00:00.000Z' }],
    },
    {
      id: 'DEF-2078',
      status: 'fixed',
      statusHistory: [
        { actor: 'Jordan Lee', from: null, to: 'open', timestamp: '2026-08-14T00:00:00.000Z' },
        { actor: 'Marcus Webb', from: 'open', to: 'fixed', timestamp: '2026-08-18T00:00:00.000Z' },
      ],
    },
  ]);
}

test('AC8: a permitted transition (developer, open -> fixed) returns 200 and persists the new status', () => {
  const repo = makeRepo();
  const result = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-1042',
    requesterRole: 'developer',
    actorName: 'Priya Patel',
    targetStatus: 'fixed',
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.defect.status, 'fixed');
  assert.equal(repo.getById('DEF-1042').status, 'fixed');
});

test('AC9: after that successful transition, the current status no longer equals the pre-transition value', () => {
  const repo = makeRepo();
  handleStatusTransitionRequest(repo, {
    defectId: 'DEF-1042',
    requesterRole: 'developer',
    actorName: 'Priya Patel',
    targetStatus: 'fixed',
  });
  assert.notEqual(repo.getById('DEF-1042').status, 'open');
});

test('AC10: tester directly requesting Open -> Fixed (bypassing the UI) is rejected with 403 and defect remains Open', () => {
  const repo = makeRepo();
  const result = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-1042',
    requesterRole: 'tester',
    actorName: 'Jordan Lee',
    targetStatus: 'fixed',
  });
  assert.equal(result.statusCode, 403);
  assert.equal(repo.getById('DEF-1042').status, 'open');
});

test('AC11: developer directly requesting Fixed -> Closed (bypassing the UI) is rejected with 403 and defect remains Fixed', () => {
  const repo = makeRepo();
  const result = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-2078',
    requesterRole: 'developer',
    actorName: 'Marcus Webb',
    targetStatus: 'closed',
  });
  assert.equal(result.statusCode, 403);
  assert.equal(repo.getById('DEF-2078').status, 'fixed');
});

test('AC12: manager directly requesting Fixed -> Closed or Fixed -> Re-opened (bypassing the UI) is rejected with 403 and defect remains Fixed', () => {
  const repo = makeRepo();

  const closedResult = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-2078',
    requesterRole: 'manager',
    actorName: 'Dana Chen',
    targetStatus: 'closed',
  });
  assert.equal(closedResult.statusCode, 403);
  assert.equal(repo.getById('DEF-2078').status, 'fixed');

  const reopenedResult = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-2078',
    requesterRole: 'manager',
    actorName: 'Dana Chen',
    targetStatus: 'reopened',
  });
  assert.equal(reopenedResult.statusCode, 403);
  assert.equal(repo.getById('DEF-2078').status, 'fixed');
});

test('unknown defect id returns 404', () => {
  const repo = makeRepo();
  const result = handleStatusTransitionRequest(repo, {
    defectId: 'DEF-9999',
    requesterRole: 'developer',
    actorName: 'Priya Patel',
    targetStatus: 'fixed',
  });
  assert.equal(result.statusCode, 404);
});
