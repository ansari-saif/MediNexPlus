import { test, expect, signInParentDept, gotoDashboard } from "../fixtures";

const email = process.env.E2E_PARENTDEPT_EMAIL || "parentdept@hospital.com";
const password = process.env.E2E_PARENTDEPT_PASSWORD || "Medinex@123";

test.describe("parentdept login", () => {
  test("user can sign in and see dashboard", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInParentDept(page, ui, email, password);
    await gotoDashboard(page, "/parentdept/dashboard");
    await expect(ui("parentdept.dashboard")).toBeVisible({ timeout: 45_000 });
  });
});
