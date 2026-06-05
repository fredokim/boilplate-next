import "server-only";
import { parseApiEnvelope } from "@/core/api/serverApiClient";
import { createApiSuccess } from "@/core/mock/dummyData";
import { OpsConsoleDto } from "../dto/OpsConsole.dto";

const opsConsolePayload = createApiSuccess({
  metrics: [
    {
      id: "conversion",
      label: "Partner conversion",
      value: 34.8,
      unit: "%",
      status: "good",
    },
    {
      id: "latency",
      label: "API latency p95",
      value: 184,
      unit: "ms",
      status: "watch",
    },
    {
      id: "error-rate",
      label: "Frontend error rate",
      value: 0.18,
      unit: "%",
      status: "good",
    },
    {
      id: "lcp",
      label: "Core Web Vitals LCP",
      value: 1.9,
      unit: "s",
      status: "good",
    },
  ],
  incidents: [
    {
      id: "inc-1004",
      service: "Remittance checkout",
      severity: "watch",
      message: "KYC retry queue increased after issuer timeout.",
      region: "KR",
      createdAt: "2026-06-03T08:14:00.000Z",
    },
    {
      id: "inc-1003",
      service: "Merchant admin",
      severity: "good",
      message: "Bulk contract upload completed with no validation failures.",
      region: "KR",
      createdAt: "2026-06-03T07:45:00.000Z",
    },
    {
      id: "inc-1002",
      service: "WebView bridge",
      severity: "risk",
      message: "Android legacy WebView reported stale auth token refresh.",
      region: "Global",
      createdAt: "2026-06-03T06:52:00.000Z",
    },
  ],
  releases: [
    {
      id: "rel-42",
      version: "2026.06.03.2",
      environment: "production",
      status: "deployed",
      durationMs: 372000,
    },
    {
      id: "rel-41",
      version: "2026.06.03.1",
      environment: "preview",
      status: "verified",
      durationMs: 214000,
    },
  ],
});

export async function getOpsConsole() {
  return parseApiEnvelope(opsConsolePayload, OpsConsoleDto);
}
