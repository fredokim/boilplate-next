import type { AppFailure } from "@/core/result/failure";
import styles from "./State.module.scss";

type ErrorStateProps = {
  title?: string;
  message?: string;
  failure?: AppFailure | undefined;
};

export function ErrorState({ failure, message, title = "Something went wrong" }: ErrorStateProps) {
  const displayMessage = failure?.message ?? message ?? "Please retry after checking the request.";

  return (
    <div className={[styles.state, styles.error].join(" ")}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{displayMessage}</p>
        {failure ? (
          <p className={styles.meta}>
            {failure.origin} / {failure.kind}
          </p>
        ) : null}
      </div>
    </div>
  );
}
