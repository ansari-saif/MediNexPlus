import { test, expect } from "../fixtures";

const email = process.env.E2E_PARENTDEPT_EMAIL || "parentdept@hospital.com";
const password = process.env.E2E_PARENTDEPT_PASSWORD || "Medinex@123";

test.describe("parentdept login", () => {
  test("user can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/parentdept/login");

    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();

    await page.waitForURL("**/parentdept/**", { timeout: 20_000 });
    await expect(ui("parentdept.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
