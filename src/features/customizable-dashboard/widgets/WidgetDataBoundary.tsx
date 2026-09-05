import type { PropsWithChildren } from "react";
import { describeFailure } from "@/core/result/failureStatus";
import styles from "../views/CustomizableDashboard.module.scss";

type WidgetDataBoundaryProps = PropsWithChildren<{
  error: Error | null;
  isEmpty: boolean;
  isPending: boolean;
  /** Offered only where trying again could plausibly work. */
  onRetry?: () => void;
}>;

const TONE_CLASS = {
  warning: styles.dataStateWarning,
  error: styles.dataStateError,
} as const;

/**
 * Says which failure this is.
 *
 * Every error used to render the same four words, "Widget data unavailable",
 * whether the device was offline, the session had ended, or the server had
 * answered in a shape the page cannot read. Those need different things from
 * the reader -- wait, sign in, tell someone -- and the widget was telling them
 * apart internally and then throwing the distinction away at the last step.
 */
export function WidgetDataBoundary({ children, error, isEmpty, isPending, onRetry }: WidgetDataBoundaryProps) {
  if (isPending) {
    return <div className={styles.dataState}>Loading widget data…</div>;
  }

  if (error) {
    const status = describeFailure(error);

    return (
      <div className={[styles.dataState, TONE_CLASS[status.tone]].join(" ")} role="status">
        <strong>{status.title}</strong>
        <span className={styles.dataStateDetail}>{status.detail}</span>
        {status.retryable && onRetry ? (
          <button className={styles.dataStateRetry} onClick={onRetry} type="button">
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return <div className={styles.dataState}>No widget data</div>;
  }

  return <>{children}</>;
}
