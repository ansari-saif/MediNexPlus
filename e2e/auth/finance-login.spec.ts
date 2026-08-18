import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_FINANCE_EMAIL || "finance@hospital.com";
const password = process.env.E2E_FINANCE_PASSWORD || "Finance@123";

test.describe("finance login", () => {
  test("finance head can sign in and see dashboard", async ({ page, ui }) => {
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
  });
});
