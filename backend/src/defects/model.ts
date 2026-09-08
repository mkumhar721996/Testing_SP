export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface DefectInput {
  title: string;
  severity: string;
  tester: string;
  component: string;
  steps: string;
}

export interface Defect {
  id: string;
  title: string;
  severity: Severity;
  tester: string;
  component: string;
  steps: string;
  status: "Open";
}
