import { DataTable } from "@/components/ui/DataTable";
import { getStatusLabel, type OpsTableRow } from "./opsTable.logic";

type OpsTableViewProps = {
  rows: OpsTableRow[];
};

export function OpsTableView({ rows }: OpsTableViewProps) {
  return (
    <DataTable
      columns={[
        {
          key: "service",
          header: "Service",
          render: (row) => row.service,
        },
        {
          key: "owner",
          header: "Owner",
          render: (row) => row.owner,
        },
        {
          key: "status",
          header: "Status",
          render: (row) => getStatusLabel(row.status),
        },
        {
          key: "latency",
          header: "Latency",
          render: (row) => `${row.latencyMs}ms`,
        },
      ]}
      emptyText="No operations found."
      getRowKey={(row) => row.id}
      rows={rows}
    />
  );
}
