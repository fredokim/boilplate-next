import { expect, test } from "@playwright/test";

/**
 * This asserted on a heading that no version of the home page has ever had. It
 * went unnoticed because CI did not run this suite; the page it was written for
 * was replaced by the WOD planner, and the planner by the index below, without
 * anything failing.
 *
 * It now checks the links as well as the heading. A landing page whose whole
 * job is to send people somewhere is not doing it if the destinations are gone.
 */
test("home page lists the examples and links to them", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Next Boilerplate", level: 1 })).toBeVisible();

  for (const name of [/Customizable Dashboard/, /Interactive Topology Explorer/, /Live Streaming Lab/]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
});

test("protected dashboard redirects anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Demo login" })).toBeVisible();
});

test("health route responds", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
});
