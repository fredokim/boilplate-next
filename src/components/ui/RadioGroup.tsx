import type { InputHTMLAttributes } from "react";
import styles from "./FormControls.module.scss";

type RadioOption = {
  label: string;
  value: string;
  description?: string | undefined;
};

type RadioGroupProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
  options: RadioOption[];
  value?: string | undefined;
};

export function RadioGroup({ label, name, onChange, options, value, ...props }: RadioGroupProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{label}</legend>
      {options.map((option) => (
        <label className={styles.check} htmlFor={`${name}-${option.value}`} key={option.value}>
          <input
            checked={value === option.value}
            id={`${name}-${option.value}`}
            name={name}
            onChange={onChange}
            type="radio"
            value={option.value}
            {...props}
          />
          <span className={styles.stack}>
            <strong>{option.label}</strong>
            {option.description ? <span className={styles.message}>{option.description}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
