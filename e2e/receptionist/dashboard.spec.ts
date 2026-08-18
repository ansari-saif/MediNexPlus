import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_RECEPTIONIST_EMAIL || "receptionist@hospital.com";
const password = process.env.E2E_RECEPTIONIST_PASSWORD || "Receptionist@123";

test.describe("receptionist staff portal", () => {
  test("receptionist can open the dedicated receptionist dashboard", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInPortal(page, ui, {
      loginPath: "/staff/login",
      dashboardPath: "/receptionist/dashboard",
      emailId: "auth.staff.login.email",
      passwordId: "auth.staff.login.password",
      submitId: "auth.staff.login.submit",
      loginApi: "/api/auth/staff/login",
      email,
      password,
    });
    await expect(ui("receptionist.dashboard")).toBeVisible({ timeout: 45_000 });
    await expect(ui("receptionist.nav.queue")).toBeVisible();
  });
});
