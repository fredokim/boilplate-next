import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/features/auth/components/LoginForm.client";
import { getServerSession } from "@/features/auth/server/session.server";
import styles from "./page.module.scss";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.heading}>
          <h1>Demo login</h1>
          <p>Login is handled through a Server Action that writes an httpOnly cookie.</p>
        </div>
        <Card>
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
