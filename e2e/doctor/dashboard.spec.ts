import { test, expect } from "../fixtures";

const email = process.env.E2E_DOCTOR_EMAIL || "doctor@hospital.com";
const password = process.env.E2E_DOCTOR_PASSWORD || "Doctor@123";

test.describe("doctor portal dashboard", () => {
  test("doctor can navigate to dashboard and profile using UIAnchors", async ({ page, ui }) => {
    await page.goto("/login");

    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();

    await page.waitForURL("**/doctor/dashboard**", { timeout: 20_000 });
    await expect(ui("doctor.dashboard")).toBeVisible({ timeout: 15_000 });
    await expect(ui("doctor.nav.appointments")).toBeVisible();
    await expect(ui("doctor.nav.patients")).toBeVisible();
    await expect(ui("doctor.nav.rx")).toBeVisible();
  });
});
