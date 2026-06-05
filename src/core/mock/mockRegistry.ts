import { createApiSuccess, dummyAuditLogs, dummyDashboardSummary, dummyNotifications, dummySession, dummyUsers } from "./dummyData";

export type MockRegistryEntry = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  success: unknown;
  empty?: unknown;
  invalid?: unknown;
  error?: unknown;
};

export const mockRegistry = [
  {
    method: "POST",
    endpoint: "/api/auth/login",
    success: createApiSuccess({ accessToken: "mock-access-token", user: dummySession.user }),
  },
  {
    method: "GET",
    endpoint: "/api/auth/session",
    success: createApiSuccess(dummySession),
  },
  {
    method: "GET",
    endpoint: "/api/users",
    success: createApiSuccess({ items: dummyUsers }),
    empty: createApiSuccess({ items: [] }),
    invalid: createApiSuccess({ items: [{ id: 1, email: "broken", name: null, role: "admin" }] }),
  },
  {
    method: "GET",
    endpoint: "/api/users/:id",
    success: createApiSuccess(dummyUsers[0]),
  },
  {
    method: "GET",
    endpoint: "/api/users/count",
    success: createApiSuccess({ count: dummyUsers.length }),
  },
  {
    method: "GET",
    endpoint: "/api/dashboard/summary",
    success: createApiSuccess(dummyDashboardSummary),
  },
  {
    method: "GET",
    endpoint: "/api/notifications",
    success: createApiSuccess({ items: dummyNotifications }),
  },
  {
    method: "GET",
    endpoint: "/api/audit-logs",
    success: createApiSuccess({ items: dummyAuditLogs }),
  },
] satisfies MockRegistryEntry[];
