import "server-only";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/features/auth/server/session.server";

export async function withServerPermission(permission: string, render: () => Promise<ReactNode> | ReactNode) {
  const session = await getServerSession();

  if (!session?.user.permissions.includes(permission)) {
    notFound();
  }

  return render();
}
