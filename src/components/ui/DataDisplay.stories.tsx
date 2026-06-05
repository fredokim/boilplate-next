"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataTable, type DataTableColumn } from "./DataTable";
import { Pagination } from "./Pagination";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const rows: UserRow[] = Array.from({ length: 9 }, (_, index) => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: index % 2 === 0 ? "admin" : "viewer",
}));

const columns: DataTableColumn<UserRow>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "email", header: "Email", render: (row) => row.email },
  { key: "role", header: "Role", render: (row) => row.role },
];

const meta = {
  title: "Molecules/DataDisplay",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function PaginatedTableDemo() {
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <DataTable columns={columns} getRowKey={(row) => row.id} rows={pageRows} />
      <Pagination onPageChange={setPage} page={page} pageCount={Math.ceil(rows.length / pageSize)} />
    </div>
  );
}

export const Table: Story = {
  render: () => <DataTable columns={columns} getRowKey={(row) => row.id} rows={rows.slice(0, 4)} />,
};

export const EmptyTable: Story = {
  render: () => <DataTable columns={columns} getRowKey={(row) => row.id} rows={[]} />,
};

export const PaginatedTable: Story = {
  render: () => <PaginatedTableDemo />,
};
