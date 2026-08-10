import { test, expect } from "../fixtures";

const email = process.env.E2E_FINANCE_EMAIL || "finance@hospital.com";
const password = process.env.E2E_FINANCE_PASSWORD || "Finance@123";

test.describe("finance login", () => {
  test("finance head can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/finance/login");

    await ui("auth.finance.login.email").fill(email);
    await ui("auth.finance.login.password").fill(password);
    await ui("auth.finance.login.submit").click();

    await page.waitForURL("**/finance/dashboard**", { timeout: 20_000 });
    await expect(ui("finance.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
