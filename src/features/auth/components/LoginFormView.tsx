import type { FormHTMLAttributes } from "react";
import type { DtoFieldErrors } from "@/core/form/fieldErrors";
import { Button } from "@/components/ui/Button";
import type { LoginInput } from "../schemas/login.schema";
import styles from "./LoginForm.module.scss";

type LoginFormViewProps = {
  action?: FormHTMLAttributes<HTMLFormElement>["action"];
  errors?: DtoFieldErrors<LoginInput> | undefined;
  isPending?: boolean;
};

export function LoginFormView({ action, errors = {}, isPending = false }: LoginFormViewProps) {
  return (
    <form className={styles.form} action={action}>
      <label className={styles.field}>
        <span>Email</span>
        <input defaultValue="demo@example.com" name="email" type="email" />
        {errors.email ? <small>{errors.email}</small> : null}
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input defaultValue="password" name="password" type="password" />
        {errors.password ? <small>{errors.password}</small> : null}
      </label>
      <Button type="submit">{isPending ? "Signing in..." : "Sign in with demo session"}</Button>
    </form>
  );
}
