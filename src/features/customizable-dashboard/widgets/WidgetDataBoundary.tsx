import type { PropsWithChildren } from "react";
import styles from "../views/CustomizableDashboard.module.scss";

type WidgetDataBoundaryProps = PropsWithChildren<{
  error: Error | null;
  isEmpty: boolean;
  isPending: boolean;
}>;

export function WidgetDataBoundary({ children, error, isEmpty, isPending }: WidgetDataBoundaryProps) {
  if (isPending) {
    return <div className={styles.dataState}>Loading widget data…</div>;
  }

  if (error) {
    return <div className={[styles.dataState, styles.dataStateError].join(" ")}>Widget data unavailable</div>;
  }

  if (isEmpty) {
    return <div className={styles.dataState}>No widget data</div>;
  }

  return <>{children}</>;
}
