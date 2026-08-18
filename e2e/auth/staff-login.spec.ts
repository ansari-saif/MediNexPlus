import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_STAFF_EMAIL || "staff@hospital.com";
const password = process.env.E2E_STAFF_PASSWORD || "Staff@123";

test.describe("staff login", () => {
  test("staff member can sign in and see dashboard", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInPortal(page, ui, {
      loginPath: "/staff/login",
      dashboardPath: "/staff/dashboard",
      emailId: "auth.staff.login.email",
      passwordId: "auth.staff.login.password",
      submitId: "auth.staff.login.submit",
      loginApi: "/api/auth/staff/login",
      email,
      password,
    });
    await expect(ui("staff.dashboard")).toBeVisible({ timeout: 45_000 });
  });
});
