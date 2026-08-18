import { test, expect, signInParentDept, gotoDashboard } from "../fixtures";

const email = process.env.E2E_DIAGNOSTIC_EMAIL || "diagnostic@hospital.com";
const password = process.env.E2E_DIAGNOSTIC_PASSWORD || "Diagnostic@123";

test.describe("diagnostic department portal", () => {
  test("diagnostic department controls render with UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInParentDept(page, ui, email, password);
    await gotoDashboard(page, "/diagnostic/dashboard");
    await expect(ui("diagnostic.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("diagnostic.nav.overview")).toBeVisible();
    await expect(ui("diagnostic.nav.appointments")).toBeVisible();
  });
});
