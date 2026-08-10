import { test, expect } from "../fixtures";

const email = process.env.E2E_STAFF_EMAIL || "staff@hospital.com";
const password = process.env.E2E_STAFF_PASSWORD || "Staff@123";

test.describe("staff login", () => {
  test("staff member can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/staff/login");

    await ui("auth.staff.login.email").fill(email);
    await ui("auth.staff.login.password").fill(password);
    await ui("auth.staff.login.submit").click();

    await page.waitForURL("**/staff/dashboard**", { timeout: 20_000 });
    await expect(ui("staff.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
