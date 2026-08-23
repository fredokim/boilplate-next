import { memo } from "react";
import type { LightweightWidget as LightweightWidgetModel } from "../model/dashboardWidget";
import styles from "../views/CustomizableDashboard.module.scss";

export const LightweightWidget = memo(function LightweightWidget({ widget }: { widget: LightweightWidgetModel }) {
  return (
    <div>
      <p className={styles.widgetLabel}>{widget.config.title}</p>
      <p className={styles.widgetValue}>{widget.config.value}</p>
    </div>
  );
});
