function cloneDefect(defect) {
  return {
    ...defect,
    statusHistory: defect.statusHistory.map((entry) => ({ ...entry })),
  };
}

export function createDefectRepository(initialDefects = []) {
  const defects = new Map(initialDefects.map((defect) => [defect.id, cloneDefect(defect)]));

  function getById(id) {
    const defect = defects.get(id);
    return defect ? cloneDefect(defect) : undefined;
  }

  function updateStatus(id, actor, toStatus) {
    const defect = defects.get(id);
    if (!defect) {
      throw new Error(`Defect not found: ${id}`);
    }
    const fromStatus = defect.status;
    defect.status = toStatus;
    defect.statusHistory.push({
      actor,
      from: fromStatus,
      to: toStatus,
      timestamp: new Date().toISOString(),
    });
    return cloneDefect(defect);
  }

  return { getById, updateStatus };
}
