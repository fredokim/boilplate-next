import styles from "./DataDisplay.module.scss";

export type DataTableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  emptyText?: string;
  getRowKey: (row: Row) => string;
};

export function DataTable<Row>({ columns, emptyText = "No data found.", getRowKey, rows }: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <div className={styles.empty}>{emptyText}</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
