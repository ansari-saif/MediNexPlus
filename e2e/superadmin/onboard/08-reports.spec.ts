import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · reports", () => {
  test("reports include the completed onboarding flow", async ({ page, ui }) => {
    await page.goto("/hospitaladmin/dashboard?tab=reports");
    await expect(ui("hospitaladmin.reports")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.reports.total-appointments")).toHaveText("1");
    await expect(ui("hospitaladmin.reports.total-patients")).toHaveText("1");
    await expect(ui("hospitaladmin.reports.active-doctors")).toHaveText("1");
    await expect(ui("hospitaladmin.reports.completed-appointments")).toHaveText("1");
  });
});
