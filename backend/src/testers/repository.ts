export type TesterStatus = "Active" | "Inactive";

export interface Tester {
  id: string;
  name: string;
  status: TesterStatus;
}

// Includes one inactive tester so the active-only filter (AC11) has
// something real to exclude.
const testers: Tester[] = [
  { id: "t1", name: "Jordan Blake", status: "Active" },
  { id: "t2", name: "Priya Nandakumar", status: "Active" },
  { id: "t3", name: "Sam O'Connell", status: "Active" },
  { id: "t4", name: "Wei Zhang", status: "Active" },
  { id: "t5", name: "Riley Chen", status: "Inactive" },
];

export function getTesters(status?: string): Tester[] {
  if (!status) return testers.slice();
  const normalized = status.toLowerCase();
  return testers.filter((t) => t.status.toLowerCase() === normalized);
}
