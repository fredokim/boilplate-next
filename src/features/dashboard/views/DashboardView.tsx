import { logoutAction } from "@/features/auth/actions/auth.actions";
import type { SessionDto } from "@/features/auth/dto/Auth.dto";
import type { UserListDto } from "@/features/user/dto/User.dto";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RefreshableUsersClient } from "../components/RefreshableUsers.client";
import styles from "./DashboardView.module.scss";

type DashboardViewProps = {
  session: SessionDto;
  users: UserListDto;
};

export function DashboardView({ session, users }: DashboardViewProps) {
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>Dashboard</h1>
          <p>Server-rendered data is validated before this view receives props.</p>
        </div>
        <form action={logoutAction}>
          <Button variant="secondary" type="submit">
            Logout
          </Button>
        </form>
      </header>
      <Card title={`Welcome, ${session.user.name}`} description="This page is protected by withServerAuth.">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.items.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <RefreshableUsersClient initialCount={users.items.length} />
    </main>
  );
}
