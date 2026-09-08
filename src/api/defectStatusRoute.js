import { canTransition } from '../domain/defectStatus.js';

export function handleStatusTransitionRequest(repository, { defectId, requesterRole, actorName, targetStatus }) {
  const defect = repository.getById(defectId);
  if (!defect) {
    return { statusCode: 404, body: { error: `Defect not found: ${defectId}` } };
  }

  if (!canTransition(requesterRole, defect.status, targetStatus)) {
    return {
      statusCode: 403,
      body: {
        error: `Role '${requesterRole}' may not transition a defect from '${defect.status}' to '${targetStatus}'.`,
        status: defect.status,
      },
    };
  }

  const updated = repository.updateStatus(defectId, actorName, targetStatus);
  return { statusCode: 200, body: { defect: updated } };
}
