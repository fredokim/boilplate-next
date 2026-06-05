import styles from "./State.module.scss";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className={styles.state}>
      <p className={styles.message}>{label}</p>
    </div>
  );
}
