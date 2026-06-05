"use server";

import { redirect } from "next/navigation";
import { toDtoFieldErrors } from "@/core/form/fieldErrors";
import { logger } from "@/core/observability/logger";
import { createDemoSession, clearDemoSession } from "../server/session.server";
import { loginSchema, type LoginInput } from "../schemas/login.schema";

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    logger.warn("Login validation failed", { fields: parsed.error.flatten().fieldErrors });
    return {
      success: false,
      errors: toDtoFieldErrors<LoginInput>(parsed.error),
    };
  }

  await createDemoSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearDemoSession();
  redirect("/login");
}
