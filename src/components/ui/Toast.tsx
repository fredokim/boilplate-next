import styles from "./Feedback.module.scss";

type ToastTone = "info" | "success" | "danger";

type ToastProps = {
  title: string;
  message?: string | undefined;
  tone?: ToastTone;
};

export function Toast({ message, title, tone = "info" }: ToastProps) {
  return (
    <div className={[styles.toast, styles[tone]].join(" ")} role="status">
      <p className={styles.toastTitle}>{title}</p>
      {message ? <p className={styles.toastMessage}>{message}</p> : null}
    </div>
  );
}
