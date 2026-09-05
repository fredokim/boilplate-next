import { memo } from "react";
import { Axis, BarSeries, Grid, LineSeries, XYChart } from "@visx/xychart";
import type { SeriesPoint } from "../data/dashboardDataSource";
import type { ChartWidget as ChartWidgetModel } from "../model/dashboardWidget";
import { useWidgetData } from "../hooks/useWidgetData";
import { WidgetDataBoundary } from "./WidgetDataBoundary";
import { useDashboardWidgetRuntime } from "../events/dashboardRuntimeContext";
import styles from "../views/CustomizableDashboard.module.scss";

type ChartWidgetProps = {
  widget: ChartWidgetModel;
};

export const ChartWidget = memo(function ChartWidget({ widget }: ChartWidgetProps) {
  const { effectiveFilters, publish } = useDashboardWidgetRuntime(widget);
  const query = useWidgetData(widget.dataSource, "series", effectiveFilters);
  const points = query.data?.points ?? [];
  const lastPoint = points.at(-1);
  const accessors = {
    xAccessor: (point: SeriesPoint) => point.label,
    yAccessor: (point: SeriesPoint) => point.value,
  };

  return (
    <div className={styles.widgetStack}>
      <p className={styles.widgetLabel}>{widget.config.title}</p>
      <WidgetDataBoundary error={query.error} onRetry={() => void query.refetch()} isEmpty={points.length === 0} isPending={query.isPending}>
        <div aria-label={`${widget.config.title} ${widget.config.chartType} chart`} className={styles.chartWrap}>
          <XYChart
            height={210}
            margin={{ top: 12, right: 12, bottom: 32, left: 48 }}
            width={500}
            xScale={{ type: "band", padding: 0.3 }}
            yScale={{ type: "linear", nice: true }}
          >
            <Grid columns={false} stroke="#e2e8f0" />
            <Axis orientation="bottom" tickLabelProps={{ fontSize: 11 }} />
            <Axis orientation="left" tickLabelProps={{ fontSize: 11 }} />
            {widget.config.chartType === "line" ? (
              <LineSeries data={points} dataKey="value" stroke="#2563eb" {...accessors} />
            ) : (
              <BarSeries colorAccessor={() => "#2563eb"} data={points} dataKey="value" {...accessors} />
            )}
          </XYChart>
          {lastPoint ? (
            <button
              className={styles.crossFilter}
              onClick={() =>
                publish({
                  type: "FilterChanged",
                  sourceWidgetId: widget.id,
                  scope: "cross-widget",
                  filters: { product: lastPoint.label },
                })
              }
              type="button"
            >
              Filter other widgets by {lastPoint.label}
            </button>
          ) : null}
        </div>
      </WidgetDataBoundary>
    </div>
  );
});
