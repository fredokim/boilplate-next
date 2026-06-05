"use client";

import { useMemo, useState } from "react";

export type LegacyOpsRow = {
  id: string;
  service: string;
  owner: string;
  status: "good" | "watch" | "risk";
  latencyMs: number;
};

type LegacyOpsTableProps = {
  rows: LegacyOpsRow[];
};

export function LegacyOpsTable({ rows }: LegacyOpsTableProps) {
  const [query, setQuery] = useState("");
  const visibleRows = useMemo(() => {
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
  }, [query, rows]);

  return (
    <section>
      <label>
        Search operations
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id}>
              <td>{row.service}</td>
              <td>{row.owner}</td>
              <td>{row.status === "good" ? "Healthy" : row.status === "watch" ? "Needs review" : "Action required"}</td>
              <td>{row.latencyMs}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
