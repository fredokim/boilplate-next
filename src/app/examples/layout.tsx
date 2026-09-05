import Link from "next/link";
import styles from "./layout.module.scss";

/**
 * A way back out of the examples.
 *
 * The home page links into these three and nothing linked out, so each one was
 * a dead end reachable only with the back button. The accessibility sweep is
 * what surfaced it: on a narrow viewport these pages scroll, and they had no
 * focusable content at all, which means a keyboard user could not scroll them.
 * axe reports that against <html>, which reads like a styling problem and is
 * really a missing link.
 */
export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <nav aria-label="Examples" className={styles.bar}>
        <Link className={styles.back} href="/">
          All examples
        </Link>
      </nav>
      {children}
    </div>
  );
}
