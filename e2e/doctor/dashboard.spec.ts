import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_DOCTOR_EMAIL || "doctor@hospital.com";
const password = process.env.E2E_DOCTOR_PASSWORD || "Doctor@123";

test.describe("doctor portal dashboard", () => {
  test("doctor can navigate to dashboard and profile using UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInPortal(page, ui, {
      loginPath: "/login",
      dashboardPath: "/doctor/dashboard",
      emailId: "auth.login.email",
      passwordId: "auth.login.password",
      submitId: "auth.login.submit",
      loginApi: "/api/auth/login",
      email,
      password,
    });
    await expect(ui("doctor.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("doctor.nav.appointments")).toBeVisible();
    await expect(ui("doctor.nav.patients")).toBeVisible();
    await expect(ui("doctor.nav.rx")).toBeVisible();
  });
});
