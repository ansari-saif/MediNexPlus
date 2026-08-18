import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_FINANCE_EMAIL || "finance@hospital.com";
const password = process.env.E2E_FINANCE_PASSWORD || "Finance@123";

test.describe("finance portal dashboard & navigation", () => {
  test("finance head can navigate dashboard tabs using UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInPortal(page, ui, {
      loginPath: "/finance/login",
      dashboardPath: "/finance/dashboard",
      emailId: "auth.finance.login.email",
      passwordId: "auth.finance.login.password",
      submitId: "auth.finance.login.submit",
      loginApi: "/api/auth/login",
      email,
      password,
    });
    await expect(ui("finance.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("finance.nav.overview")).toBeVisible();
    await expect(ui("finance.nav.bills")).toBeVisible();
    await expect(ui("finance.nav.expenses")).toBeVisible();
    await expect(ui("finance.nav.payments")).toBeVisible();
    await expect(ui("finance.nav.reports")).toBeVisible();
  });
});
