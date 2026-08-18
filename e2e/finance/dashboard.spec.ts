import { test, expect } from "../fixtures";

const email = process.env.E2E_FINANCE_EMAIL || "finance@hospital.com";
const password = process.env.E2E_FINANCE_PASSWORD || "Finance@123";

test.describe("finance portal dashboard & navigation", () => {
  test("finance head can navigate dashboard tabs using UIAnchors", async ({ page, ui }) => {
    await page.goto("/finance/login");

    await ui("auth.finance.login.email").fill(email);
    await ui("auth.finance.login.password").fill(password);
    await ui("auth.finance.login.submit").click();

    await page.waitForURL("**/finance/dashboard**", { timeout: 20_000 });
    await expect(ui("finance.dashboard")).toBeVisible({ timeout: 15_000 });
    await expect(ui("finance.nav.overview")).toBeVisible();
    await expect(ui("finance.nav.bills")).toBeVisible();
    await expect(ui("finance.nav.expenses")).toBeVisible();
    await expect(ui("finance.nav.payments")).toBeVisible();
    await expect(ui("finance.nav.reports")).toBeVisible();
  });
});
