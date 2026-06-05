import type { LegacyOpsRow } from "../legacy/LegacyOpsTable.client";

export type OpsTableRow = LegacyOpsRow;

export function filterOpsRows(rows: OpsTableRow[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) => {
    return (
      row.service.toLowerCase().includes(normalizedQuery) ||
      row.owner.toLowerCase().includes(normalizedQuery) ||
      row.status.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getStatusLabel(status: OpsTableRow["status"]) {
  const labels: Record<OpsTableRow["status"], string> = {
    good: "Healthy",
    watch: "Needs review",
    risk: "Action required",
  };

  return labels[status];
}
