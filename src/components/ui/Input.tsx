import type { InputHTMLAttributes } from "react";
import styles from "./FormControls.module.scss";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
};

export function Input({ className = "", error, hint, id, label, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const descriptionId = `${inputId}-description`;

  return (
    <label className={styles.field} htmlFor={inputId}>
      {label}
      <input
        aria-describedby={hint || error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        className={[styles.control, error ? styles.error : "", className].join(" ")}
        id={inputId}
        {...props}
      />
      {error || hint ? (
        <span className={[styles.message, error ? styles.errorText : ""].join(" ")} id={descriptionId}>
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
}
