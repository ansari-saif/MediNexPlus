import { test, expect } from "./fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

test.describe("hospital admin login", () => {
  test("user can sign in and see dashboard", async ({ page, ui }) => {
    await page.goto("/login");

    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();

    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });
    await expect(ui("hospitaladmin.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});