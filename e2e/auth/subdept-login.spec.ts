import { test, expect, signInPortal } from "../fixtures";

const email = process.env.E2E_SUBDEPT_EMAIL || "subdept@hospital.com";
const password = process.env.E2E_SUBDEPT_PASSWORD || "SubDept@123";

test.describe("subdept login", () => {
  test("sub-department head can sign in and see dashboard", async ({ page, ui }) => {
    test.setTimeout(120_000);
    await signInPortal(page, ui, {
      loginPath: "/subdept/login",
      dashboardPath: "/subdept/dashboard",
      emailId: "auth.subdept.login.email",
      passwordId: "auth.subdept.login.password",
      submitId: "auth.subdept.login.submit",
      loginApi: "/api/auth/subdept/login",
      email,
      password,
    });
    await expect(ui("subdept.dashboard")).toBeVisible({ timeout: 45_000 });
  });
});
