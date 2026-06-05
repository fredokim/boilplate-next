import Link from "next/link";
import { ErrorState } from "@/components/states/ErrorState";

export default function NotFound() {
  return (
    <main>
      <ErrorState title="Page not found" message="The requested resource is unavailable." />
      <Link href="/">Back home</Link>
    </main>
  );
}
