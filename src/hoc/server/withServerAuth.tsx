import "server-only";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/features/auth/server/session.server";

export async function withServerAuth(render: () => Promise<ReactNode> | ReactNode) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return render();
}
