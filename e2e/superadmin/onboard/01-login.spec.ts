import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · login", () => {
  test("superadmin can sign in and see dashboard", async ({ superAdminLogin, ui }) => {
    await expect(ui("superadmin.dashboard")).toBeVisible();
    await expect(superAdminLogin.page).toHaveURL(/\/superadmin\/dashboard/);
  });
});
