"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/auth.actions";
import { LoginFormView } from "./LoginFormView";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    success: true,
    errors: {},
  });

  return <LoginFormView action={formAction} errors={state.errors} isPending={isPending} />;
}
