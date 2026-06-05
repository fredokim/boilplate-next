import { getServerSession } from "@/features/auth/server/session.server";
import { getUsers } from "@/features/user/server/users.server";
import { DashboardView } from "@/features/dashboard/views/DashboardView";
import { withServerAuth } from "@/hoc/server/withServerAuth";

export default async function DashboardPage() {
  return withServerAuth(async () => {
    const [session, users] = await Promise.all([getServerSession(), getUsers()]);

    if (!session) {
      throw new Error("Session should be resolved by withServerAuth.");
    }

    return <DashboardView session={session} users={users} />;
  });
}
