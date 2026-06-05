import { expect, test } from "@playwright/test";

test("ops console renders operational proof surface and switches locale", async ({ page }) => {
  await page.goto("/ops-console");

  await expect(page.getByRole("heading", { name: "Global Ops Console" })).toBeVisible();
  await expect(page.getByText("Partner conversion")).toBeVisible();
  await expect(page.getByText("Core Web Vitals LCP")).toBeVisible();
  await expect(page.getByText("실시간 이벤트")).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();

  await expect(page.getByText("Track B2B operations, live status, and performance signals")).toBeVisible();
  await expect(page.getByText("Live events")).toBeVisible();
  await expect(page.getByText("Release pipeline")).toBeVisible();
});
