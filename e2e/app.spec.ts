import { expect, test } from "@playwright/test";

test("home page renders boilerplate overview", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Next App Router boundaries/i })).toBeVisible();
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
