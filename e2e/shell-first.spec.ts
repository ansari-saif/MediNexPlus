import type { Page } from "@playwright/test";
import { test, expect, signInPortal, gotoDashboard, type UiFixture } from "./fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

async function loginHospitalAdmin(page: Page, ui: UiFixture) {
  await signInPortal(page, ui, {
    loginPath: "/login",
    dashboardPath: "/hospitaladmin/dashboard",
    emailId: "auth.login.email",
    passwordId: "auth.login.password",
    submitId: "auth.login.submit",
    loginApi: "/api/auth/login",
    email,
    password,
  });
  await expect(ui("hospitaladmin.nav.overview")).toBeVisible({ timeout: 30_000 });
}

test.describe("shell-first modules", () => {
  test("staff page paints chrome immediately", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);
    await gotoDashboard(page, "/hospitaladmin/staff");
    await expect(ui("hospitaladmin.nav.staff")).toBeVisible({ timeout: 20_000 });
    await expect(ui("hospitaladmin.staff")).toBeVisible({ timeout: 20_000 });
  });

  test("doctors page paints chrome immediately", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);
    await gotoDashboard(page, "/hospitaladmin/doctors");
    await expect(ui("hospitaladmin.nav.doctors")).toBeVisible({ timeout: 20_000 });
    await expect(ui("hospitaladmin.doctors")).toBeVisible({ timeout: 20_000 });
  });

  test("appointments page paints chrome immediately", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);
    await gotoDashboard(page, "/hospitaladmin/appointments");
    await expect(ui("hospitaladmin.nav.appointments")).toBeVisible({ timeout: 20_000 });
    await expect(ui("hospitaladmin.appointments")).toBeVisible({ timeout: 20_000 });
  });

  test("consultation page paints chrome immediately", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);
    await gotoDashboard(page, "/hospitaladmin/consultation");
    await expect(ui("hospitaladmin.nav.consultation")).toBeVisible({ timeout: 20_000 });
    await expect(ui("hospitaladmin.consultation")).toBeVisible({ timeout: 20_000 });
  });

  test("configure shows a loader while auth is in flight", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);

    await page.route("**/api/auth/me**", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });

    await gotoDashboard(page, "/hospitaladmin/configure");
    await expect(ui("hospitaladmin.nav.configure")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.configure")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.configure.loading")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.configure.loading")).toBeHidden({ timeout: 20_000 });
  });

  test("profile shows a loader while auth is in flight", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);

    await page.route("**/api/auth/me**", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });

    await gotoDashboard(page, "/hospitaladmin/profile");
    await expect(ui("hospitaladmin.nav.overview")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.profile")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.profile.loading")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.profile.loading")).toBeHidden({ timeout: 20_000 });
  });

  test("finance shows a loader while dashboard API is in flight", async ({ page, ui }) => {
    await loginHospitalAdmin(page, ui);

    await page.route("**/api/finance/dashboard**", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });

    await gotoDashboard(page, "/hospitaladmin/finance");
    await expect(ui("hospitaladmin.nav.finance")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.finance")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.finance.loading")).toBeVisible({ timeout: 15_000 });
    await expect(ui("hospitaladmin.finance.loading")).toBeHidden({ timeout: 20_000 });
  });
});
