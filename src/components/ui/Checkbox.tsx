import type { InputHTMLAttributes } from "react";
import styles from "./FormControls.module.scss";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string | undefined;
};

export function Checkbox({ description, id, label, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className={styles.check} htmlFor={checkboxId}>
      <input id={checkboxId} type="checkbox" {...props} />
      <span className={styles.stack}>
        <strong>{label}</strong>
        {description ? <span className={styles.message}>{description}</span> : null}
      </span>
    </label>
  );
}
