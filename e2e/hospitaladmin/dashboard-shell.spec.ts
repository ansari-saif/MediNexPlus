import { test, expect } from "../fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

test.describe("hospital admin dashboard shell", () => {
  test("chrome paints immediately and shows a loader while overview API is in flight", async ({ page, ui }) => {
    await page.route("**/api/dashboard/overview**", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });

    await page.goto("/login");
    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();

    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });

    await expect(ui("hospitaladmin.nav.overview")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.dashboard")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.dashboard.loading")).toBeVisible({ timeout: 5_000 });
    await expect(ui("hospitaladmin.dashboard.loading")).toBeHidden({ timeout: 20_000 });
  });
});
