import { test, expect, signInParentDept, gotoDashboard } from "../fixtures";

const email = process.env.E2E_CLINICAL_EMAIL || "clinical@hospital.com";
const password = process.env.E2E_CLINICAL_PASSWORD || "Clinical@123";

test.describe("clinical department portal", () => {
  test("clinical department controls render with UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInParentDept(page, ui, email, password);
    await gotoDashboard(page, "/clinical/dashboard");
    await expect(ui("clinical.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("clinical.nav.overview")).toBeVisible();
    await expect(ui("clinical.nav.appointments")).toBeVisible();
  });
});
