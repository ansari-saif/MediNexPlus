import { test, expect } from "../fixtures";

const email = process.env.E2E_SUPERADMIN_EMAIL || "superadmin@medinex.com";
const password = process.env.E2E_SUPERADMIN_PASSWORD || "SuperAdmin@123";

test.describe("superadmin login", () => {
  test("superadmin can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/superadmin/login");

    await ui("auth.superadmin.login.email").fill(email);
    await ui("auth.superadmin.login.password").fill(password);
    await ui("auth.superadmin.login.submit").click();

    await page.waitForURL("**/superadmin/dashboard**", { timeout: 20_000 });
    await expect(ui("superadmin.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
