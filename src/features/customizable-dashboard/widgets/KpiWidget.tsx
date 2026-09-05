import { memo } from "react";
import type { KpiWidget as KpiWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../hooks/useWidgetData";
import { WidgetDataBoundary } from "./WidgetDataBoundary";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntimeContext";
import styles from "../views/CustomizableDashboard.module.scss";

type KpiWidgetProps = {
  widget: KpiWidgetModel;
};

export const KpiWidget = memo(function KpiWidget({ widget }: KpiWidgetProps) {
  const { effectiveFilters } = useDashboardWidgetRuntime(widget);
  const query = useWidgetData(widget.dataSource, "kpi", effectiveFilters);
  const isEmpty = query.data?.value === undefined;

  return (
    <div className={styles.widgetStack}>
      <p className={styles.widgetLabel}>{widget.config.title}</p>
      <WidgetDataBoundary error={query.error} onRetry={() => void query.refetch()} isEmpty={isEmpty} isPending={query.isPending}>
        <div>
          <p className={styles.muted}>{query.data?.label}</p>
          <p className={styles.widgetValue}>{query.data?.value?.toLocaleString()}</p>
          {query.data?.trend ? <p className={styles.widgetTrend}>{query.data.trend}</p> : null}
        </div>
      </WidgetDataBoundary>
    </div>
  );
});
