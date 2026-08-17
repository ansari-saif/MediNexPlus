import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · hospital admin login", () => {
  test("newly created hospital admin can sign in", async ({
    hospitalAdminLogin,
    createdHospital,
    ui,
  }) => {
    test.setTimeout(90_000);
    await hospitalAdminLogin.login(createdHospital.adminEmail, createdHospital.adminPassword);
    await expect(ui("hospitaladmin.dashboard")).toBeVisible();
  });
});
