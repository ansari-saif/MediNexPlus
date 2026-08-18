import { test, expect, signInParentDept, gotoDashboard } from "../fixtures";

const email = process.env.E2E_SUPPORT_EMAIL || "support@hospital.com";
const password = process.env.E2E_SUPPORT_PASSWORD || "Support@123";

test.describe("support department portal", () => {
  test("support department controls render with UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInParentDept(page, ui, email, password);
    await gotoDashboard(page, "/support/dashboard");
    await expect(ui("support.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("support.nav.overview")).toBeVisible();
    await expect(ui("support.nav.appointments")).toBeVisible();
  });
});
