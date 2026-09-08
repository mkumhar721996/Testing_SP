import type { Defect, DefectInput, Severity } from "./model.ts";

let defects: Defect[] = [];
let nextId = 101;

export function addDefect(input: DefectInput): Defect {
  const defect: Defect = {
    id: `DEF-${nextId++}`,
    title: input.title.trim(),
    severity: input.severity as Severity,
    tester: input.tester,
    component: input.component,
    steps: input.steps.trim(),
    status: "Open",
  };
  defects.push(defect);
  return defect;
}

export function listDefects(): Defect[] {
  return defects.slice();
}

export function resetDefectsForTests(): void {
  defects = [];
  nextId = 101;
}
