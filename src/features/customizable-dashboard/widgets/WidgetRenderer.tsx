import { memo, Suspense } from "react";
import type { DashboardWidget } from "../model/dashboardWidget";
import { recordWidgetRender } from "../performance/dashboardPerformanceMetrics";
import type { WidgetRegistry } from "./widgetRegistry";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import styles from "../views/CustomizableDashboard.module.scss";

export const WidgetRenderer = memo(function WidgetRenderer({
  registry,
  widget,
}: {
  registry: WidgetRegistry;
  widget: DashboardWidget;
}) {
  recordWidgetRender(widget.id);
  const Component = registry.get(widget.type).component;
  return (
    <WidgetErrorBoundary>
      <Suspense
        fallback={
          <div className={styles.dataState} role="status">
            Loading widget module…
          </div>
        }
      >
        <Component widget={widget} />
      </Suspense>
    </WidgetErrorBoundary>
  );
});
