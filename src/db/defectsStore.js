'use strict';

/**
 * Minimal in-memory defects repository. Deliberately narrow (get/list/insert/update)
 * so a real database can replace it later without touching callers.
 */
function createDefectsStore(initialDefects = []) {
  const defects = new Map();

  function seed(records) {
    defects.clear();
    for (const record of records) {
      defects.set(record.id, { ...record });
    }
  }

  seed(initialDefects);

  return {
    list() {
      return Array.from(defects.values()).map((d) => ({ ...d }));
    },
    get(id) {
      const found = defects.get(id);
      return found ? { ...found } : undefined;
    },
    insert(defect) {
      defects.set(defect.id, { ...defect });
      return { ...defect };
    },
    update(id, patch) {
      const existing = defects.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch };
      defects.set(id, updated);
      return { ...updated };
    },
  };
}

module.exports = { createDefectsStore };
