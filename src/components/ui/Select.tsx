import type { SelectHTMLAttributes } from "react";
import styles from "./FormControls.module.scss";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  options: SelectOption[];
};

export function Select({ error, hint, id, label, options, ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const descriptionId = `${selectId}-description`;

  return (
    <label className={styles.field} htmlFor={selectId}>
      {label}
      <select
        aria-describedby={hint || error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        className={[styles.control, error ? styles.error : ""].join(" ")}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error || hint ? (
        <span className={[styles.message, error ? styles.errorText : ""].join(" ")} id={descriptionId}>
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
}
