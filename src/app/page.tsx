import type { Route } from "next";
import Link from "next/link";
import styles from "./page.module.scss";

/**
 * The landing page lists what this repository demonstrates.
 *
 * It used to render the WOD planner this project was started from, which meant
 * the first screen of a deployed boilerplate was an unrelated application. That
 * was fixed by changing the landing page — and the planner itself stayed, 2,106
 * lines of it, reachable from no route at all. It has since been removed.
 */
type Example = {
  // `Route` rather than `string`: typed routes are on, so a link to a page that
  // does not exist fails the typecheck instead of the visitor's click.
  href: Route;
  title: string;
  body: string;
};

const examples: readonly Example[] = [
  {
    href: "/examples/dashboard",
    title: "Customizable Dashboard",
    body: "Draggable widgets with per-widget data sources, filters, and personalization presets that survive a reload.",
  },
  {
    href: "/examples/graph",
    title: "Interactive Topology Explorer",
    body: "A topology viewer and editor with a runtime health layer streamed over a WebSocket, including resync after a dropped connection.",
  },
  {
    href: "/examples/live",
    title: "Live Streaming Lab",
    body: "Video playback beside a realtime chat that buffers, de-duplicates, and caps what it renders.",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    body: "The authenticated shell: server components fetching through the route handlers, with the access token held in a cookie the page cannot read.",
  },
  {
    href: "/ops-console",
    title: "Ops Console",
    body: "Users, notifications, and audit logs — the screens where pagination, permissions, and empty states have to behave.",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Next.js App Router</p>
        <h1 className={styles.title}>Next Boilerplate</h1>
        <p className={styles.lede}>
          Patterns for server boundaries, realtime features, and a backend shared with the React and Vue
          boilerplates. Every screen below talks to that backend through this app&rsquo;s own route handlers, so
          the browser sees a single origin.
        </p>
      </header>

      <ul className={styles.list}>
        {examples.map((example) => (
          <li key={example.href}>
            <Link className={styles.card} href={example.href}>
              <h2 className={styles.cardTitle}>{example.title}</h2>
              <p className={styles.cardBody}>{example.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        Most of these need a session. <Link href="/login">Sign in</Link> first — the demo account is seeded by the
        backend.
      </p>
    </main>
  );
}
