import { test, expect } from "../fixtures";

const email = process.env.E2E_SUPERADMIN_EMAIL || "admin@medinex.com";
const password = process.env.E2E_SUPERADMIN_PASSWORD || "Medinex@123";
const securityKey = process.env.E2E_SUPERADMIN_SECURITY_KEY || "medinex-dev-key-2026";

test.describe("superadmin login", () => {
  test("superadmin can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/superadmin/login");

    await ui("auth.superadmin.login.email").fill(email);
    await ui("auth.superadmin.login.password").fill(password);
    await ui("auth.superadmin.login.security-key").fill(securityKey);
    await ui("auth.superadmin.login.submit").click();

    await page.waitForURL("**/superadmin/dashboard**", { timeout: 20_000 });
    await expect(ui("superadmin.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
