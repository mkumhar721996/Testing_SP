export const TRANSITIONS = {
  developer: { open: ['fixed'], fixed: ['open'] },
  tester: { fixed: ['closed', 'reopened'], closed: ['reopened'], reopened: ['fixed'] },
  manager: {},
};

export const STATUS_META = {
  open: { label: 'Open', chipClass: 'chip' },
  fixed: { label: 'Fixed', chipClass: 'chip chip-warning' },
  closed: { label: 'Closed', chipClass: 'chip chip-success' },
  reopened: { label: 'Re-opened', chipClass: 'chip chip-danger' },
};

export const ACTION_LABELS = {
  open: 'Reopen for Development',
  fixed: 'Mark as Fixed',
  closed: 'Close',
  reopened: 'Re-open',
};

export function getAllowedTransitions(role, status) {
  return (TRANSITIONS[role] && TRANSITIONS[role][status]) || [];
}

export function canTransition(role, fromStatus, toStatus) {
  return getAllowedTransitions(role, fromStatus).includes(toStatus);
}
