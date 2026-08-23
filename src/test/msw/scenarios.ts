import { delay, http, HttpResponse } from "msw";
import {
  createApiError,
  createApiSuccess,
  dummyDashboardConversionSeries,
  dummyDashboardKpi,
  dummyDashboardSeries,
  dummyDashboardTable,
  emptyDashboardWidgetData,
} from "@/core/mock/dummyData";

/**
 * Route handlers under src/app/api serve these payloads in the running app. Tests hit
 * the same paths through MSW so the client API layer, DTO validation, and widget
 * boundaries all run for real instead of being stubbed out.
 */
export const apiScenarios = {
  dashboardKpi: http.get("*/api/dashboard/kpi", () => HttpResponse.json(createApiSuccess(dummyDashboardKpi))),
  dashboardChart: http.get("*/api/dashboard/chart", ({ request }) => {
    const metric = new URL(request.url).searchParams.get("metric");
    return HttpResponse.json(
      createApiSuccess(metric === "conversion" ? dummyDashboardConversionSeries : dummyDashboardSeries),
    );
  }),
  dashboardTable: http.get("*/api/dashboard/table", () => HttpResponse.json(createApiSuccess(dummyDashboardTable))),
  dashboardKpiEmpty: http.get("*/api/dashboard/kpi", () =>
    HttpResponse.json(createApiSuccess(emptyDashboardWidgetData.kpi)),
  ),
  dashboardDataDelayed: [
    http.get("*/api/dashboard/kpi", async () => {
      await delay(1_000);
      return HttpResponse.json(createApiSuccess(dummyDashboardKpi));
    }),
    http.get("*/api/dashboard/chart", async () => {
      await delay(1_000);
      return HttpResponse.json(createApiSuccess(dummyDashboardSeries));
    }),
    http.get("*/api/dashboard/table", async () => {
      await delay(1_000);
      return HttpResponse.json(createApiSuccess(dummyDashboardTable));
    }),
  ],
  dashboardDataError: [
    http.get("*/api/dashboard/kpi", () =>
      HttpResponse.json(createApiError("DASHBOARD_UNAVAILABLE", "Dashboard data is unavailable."), { status: 503 }),
    ),
    http.get("*/api/dashboard/chart", () =>
      HttpResponse.json(createApiError("DASHBOARD_UNAVAILABLE", "Dashboard data is unavailable."), { status: 503 }),
    ),
    http.get("*/api/dashboard/table", () =>
      HttpResponse.json(createApiError("DASHBOARD_UNAVAILABLE", "Dashboard data is unavailable."), { status: 503 }),
    ),
  ],
};

export const defaultHandlers = [apiScenarios.dashboardKpi, apiScenarios.dashboardChart, apiScenarios.dashboardTable];
