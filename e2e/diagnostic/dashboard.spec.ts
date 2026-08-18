import { test, expect } from "../fixtures";

const email = process.env.E2E_SUBDEPT_EMAIL || "subdept@hospital.com";
const password = process.env.E2E_SUBDEPT_PASSWORD || "SubDept@123";

test.describe("diagnostic department portal", () => {
  test("diagnostic department controls render with UIAnchors", async ({ page, ui }) => {
    await page.goto("/subdept/login");

    await ui("auth.subdept.login.email").fill(email);
    await ui("auth.subdept.login.password").fill(password);
    await ui("auth.subdept.login.submit").click();

    await page.waitForURL("**/subdept/**", { timeout: 20_000 });
    await expect(ui("subdept.dashboard")).toBeVisible({ timeout: 15_000 });
  });
});
