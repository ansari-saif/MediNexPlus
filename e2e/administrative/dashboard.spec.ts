import { test, expect, signInParentDept, gotoDashboard } from "../fixtures";

const email = process.env.E2E_ADMINISTRATIVE_EMAIL || "administrative@hospital.com";
const password = process.env.E2E_ADMINISTRATIVE_PASSWORD || "Administrative@123";

test.describe("administrative department portal", () => {
  test("administrative department controls render with UIAnchors", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInParentDept(page, ui, email, password);
    await gotoDashboard(page, "/administrative/dashboard");
    await expect(ui("administrative.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("administrative.nav.overview")).toBeVisible();
    await expect(ui("administrative.nav.appointments")).toBeVisible();
  });
});
