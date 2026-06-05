"use client";

import { useEffect, useState } from "react";
import type { OpsIncidentDto } from "../dto/OpsConsole.dto";
import type { OpsMessages } from "../i18n/opsDictionary";
import styles from "./LiveIncidentFeed.module.scss";

type LiveIncidentFeedProps = {
  incidents: OpsIncidentDto[];
  messages: OpsMessages;
};

const generatedEvents = [
  "Sentry alert grouped by release version.",
  "WebSocket heartbeat recovered after reconnect.",
  "i18n fallback bundle loaded for checkout screen.",
];
const fallbackEvent = "Realtime monitor received a health check.";

export function LiveIncidentFeed({ incidents, messages }: LiveIncidentFeedProps) {
  const [events, setEvents] = useState(incidents);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEvents((current) => {
        const event = generatedEvents[current.length % generatedEvents.length] ?? fallbackEvent;
        const next = {
          id: `live-${current.length}`,
          service: "Realtime monitor",
          severity: current.length % 2 === 0 ? "good" : "watch",
          message: event,
          region: "Global",
          createdAt: new Date().toISOString(),
        } satisfies OpsIncidentDto;

        return [next, ...current].slice(0, 5);
      });
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.feed} aria-live="polite">
      <div className={styles.feedHeader}>
        <span className={styles.liveDot} />
        <strong>{messages.live}</strong>
      </div>
      {events.map((incident) => (
        <article className={styles.event} key={incident.id}>
          <div>
            <strong>{incident.service}</strong>
            <p>{incident.message}</p>
          </div>
          <span className={[styles.badge, styles[incident.severity]].join(" ")}>{incident.severity}</span>
        </article>
      ))}
    </div>
  );
}
