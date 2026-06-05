import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

export function Button({ children, className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={[styles.button, styles[variant], className].join(" ")} type={type} {...props}>
      {children}
    </button>
  );
}
