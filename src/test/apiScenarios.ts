import {
  createApiError,
  createApiSuccess,
  dummyAuditLogs,
  dummyDashboardSummary,
  dummyNotifications,
  dummyUsers,
} from "@/core/mock/dummyData";

export const apiScenarios = {
  usersSuccess: createApiSuccess({
    items: dummyUsers,
  }),
  usersEmpty: createApiSuccess({
    items: [],
  }),
  usersInvalidDto: createApiSuccess({
    items: [{ id: 1, email: "broken", name: null, role: "admin" }],
  }),
  usersBackendError: createApiError("USERS_UNAVAILABLE", "Users are unavailable."),
  usersCount: createApiSuccess({
    count: dummyUsers.length,
  }),
  dashboardSummary: createApiSuccess(dummyDashboardSummary),
  notifications: createApiSuccess({
    items: dummyNotifications,
  }),
  auditLogs: createApiSuccess({
    items: dummyAuditLogs,
  }),
} as const;
