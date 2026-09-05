import { memo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TableWidget as TableWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../hooks/useWidgetData";
import { WidgetDataBoundary } from "./WidgetDataBoundary";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntimeContext";
import styles from "../views/CustomizableDashboard.module.scss";

type TableWidgetProps = {
  widget: TableWidgetModel;
};

export const TableWidget = memo(function TableWidget({ widget }: TableWidgetProps) {
  const { effectiveFilters, publish } = useDashboardWidgetRuntime(widget);
  const query = useWidgetData(widget.dataSource, "table", effectiveFilters);
  const rows = query.data?.rows ?? [];
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 36,
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => scrollElement,
    initialRect: { width: 800, height: 220 },
    observeElementRect: (_instance, callback) => {
      callback({ width: scrollElement && scrollElement.clientWidth > 0 ? scrollElement.clientWidth : 800, height: 220 });
      return () => undefined;
    },
    overscan: 3,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className={styles.widgetStack}>
      <p className={styles.widgetLabel}>{widget.config.title}</p>
      <WidgetDataBoundary error={query.error} onRetry={() => void query.refetch()} isEmpty={rows.length === 0} isPending={query.isPending}>
        <div>
          <div className={styles.virtualTableHeader}>
            {query.data?.columns.map((column) => <strong key={column.key}>{column.label}</strong>)}
            <strong>Interaction</strong>
          </div>
          <div className={styles.virtualTable} data-rendered-row-count={virtualRows.length} ref={setScrollElement}>
            <div className={styles.virtualTableBody} style={{ height: rowVirtualizer.getTotalSize() }}>
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <div
                    className={styles.virtualTableRow}
                    data-index={virtualRow.index}
                    key={row.id}
                    style={{ height: virtualRow.size, transform: `translateY(${String(virtualRow.start)}px)` }}
                  >
                    {query.data?.columns.map((column) => <span key={column.key}>{row[column.key]}</span>)}
                    <span>
                      <button
                        className={styles.crossFilter}
                        onClick={() =>
                          publish({
                            type: "FilterChanged",
                            sourceWidgetId: widget.id,
                            scope: "cross-widget",
                            filters: { product: row.event },
                          })
                        }
                        type="button"
                      >
                        Filter dashboard
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className={styles.virtualTableDebug}>
            Rendered rows: {virtualRows.length} / {rows.length}
          </p>
        </div>
      </WidgetDataBoundary>
    </div>
  );
});
