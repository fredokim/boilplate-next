"use client";

import { useMemo, useState } from "react";
import { filterOpsRows, type OpsTableRow } from "./opsTable.logic";
import { OpsTableView } from "./OpsTableView";

type OpsTableProps = {
  rows: OpsTableRow[];
};

export function OpsTable({ rows }: OpsTableProps) {
  const [query, setQuery] = useState("");
  const visibleRows = useMemo(() => filterOpsRows(rows, query), [query, rows]);

  return (
    <section>
      <label>
        Search operations
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <OpsTableView rows={visibleRows} />
    </section>
  );
}
