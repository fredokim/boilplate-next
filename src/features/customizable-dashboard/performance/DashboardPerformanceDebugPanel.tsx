import { useDashboardRenderCount, useWidgetRenderCount } from "./dashboardPerformanceMetrics";
import styles from "../views/CustomizableDashboard.module.scss";

export function DashboardPerformanceDebugPanel({
  selectedWidgetId,
  widgetCount,
}: {
  selectedWidgetId: string | null;
  widgetCount: number;
}) {
  const renderCount = useDashboardRenderCount();
  const selectedWidgetRenderCount = useWidgetRenderCount(selectedWidgetId);
  return (
    <aside aria-label="Dashboard performance debug" className={styles.performanceDebug}>
      <strong>Performance debug</strong>
      <span>Widgets: {widgetCount}</span>
      <span>Dashboard renders: {renderCount}</span>
      <span>Selected: {selectedWidgetId ?? "none"}</span>
      <span>Selected widget renders: {selectedWidgetRenderCount}</span>
    </aside>
  );
}
