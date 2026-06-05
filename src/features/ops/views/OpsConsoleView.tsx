"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { OpsConsoleDto, OpsReleaseDto } from "../dto/OpsConsole.dto";
import { LiveIncidentFeed } from "../components/LiveIncidentFeed.client";
import type { OpsLocale } from "../i18n/opsDictionary";
import { opsDictionary } from "../i18n/opsDictionary";
import styles from "./OpsConsoleView.module.scss";

type OpsConsoleViewProps = {
  data: OpsConsoleDto;
};

export function OpsConsoleView({ data }: OpsConsoleViewProps) {
  const [locale, setLocale] = useState<OpsLocale>("ko");
  const messages = useMemo(() => opsDictionary[locale], [locale]);

  return (
    <main className={styles.page} lang={locale}>
      <div className={styles.toolbar} aria-label={messages.locale}>
        <button className={locale === "ko" ? styles.activeLocale : styles.localeButton} onClick={() => setLocale("ko")} type="button">
          KO
        </button>
        <button className={locale === "en" ? styles.activeLocale : styles.localeButton} onClick={() => setLocale("en")} type="button">
          EN
        </button>
      </div>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Portfolio proof surface</p>
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
      </header>

      <section className={styles.metrics} aria-label={messages.metrics}>
        {data.metrics.map((metric) => (
          <Card key={metric.id} title={metric.label}>
            <div className={styles.metricValue}>
              {metric.value}
              <span>{metric.unit}</span>
            </div>
            <span className={[styles.metricStatus, styles[metric.status]].join(" ")}>{metric.status}</span>
          </Card>
        ))}
      </section>

      <section className={styles.grid}>
        <Card title={messages.incidents} description="WebSocket-shaped client feed with server-validated initial data.">
          <LiveIncidentFeed incidents={data.incidents} messages={messages} />
        </Card>
        <Card title={messages.releases} description="CI/CD deployment status shaped for ops handoff.">
          <DataTable
            columns={[
              {
                key: "version",
                header: messages.version,
                render: (release: OpsReleaseDto) => release.version,
              },
              {
                key: "environment",
                header: messages.environment,
                render: (release: OpsReleaseDto) => release.environment,
              },
              {
                key: "status",
                header: messages.severity,
                render: (release: OpsReleaseDto) => <span className={styles.status}>{release.status}</span>,
              },
              {
                key: "duration",
                header: messages.duration,
                render: (release: OpsReleaseDto) => `${Math.round(release.durationMs / 1000)}s`,
              },
            ]}
            getRowKey={(release) => release.id}
            rows={data.releases}
          />
        </Card>
      </section>
    </main>
  );
}
