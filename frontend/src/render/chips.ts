const SEVERITY_CHIP_CLASS: Record<string, string> = {
  Critical: "chip-sev-critical",
  High: "chip-sev-high",
  Medium: "chip-sev-medium",
  Low: "chip-sev-low",
};

export function severityChipClass(severity: string): string {
  return SEVERITY_CHIP_CLASS[severity] ?? "chip-sev-low";
}

export function statusChipClass(status: string): string {
  return status === "Open" ? "chip-status-open" : "chip-status-progress";
}
