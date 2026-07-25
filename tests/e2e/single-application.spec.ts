import { test, expect } from "@playwright/test";

test.describe("Single Application Flow E2E Smoke Test", () => {
  test("login page renders login button and brand title", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.getByRole("heading", { name: "ApplyDesk" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();
  });
});
